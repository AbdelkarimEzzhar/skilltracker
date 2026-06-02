import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { EJSON } from 'bson';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from './src/config/database';
import { Resource, Competence } from './src/models';

dotenv.config();

type AnyDoc = Record<string, any>;

type SeedSource = 'resources.json' | 'resources.bson' | 'formations.bson';

const resolveBackupDir = (): string => {
    if (process.env.SEED_BACKUP_DIR) {
        return process.env.SEED_BACKUP_DIR;
    }

    return path.resolve(process.cwd(), '..', 'backup_mars_2026', 'skilltrack');
};

const loadBson = (filePath: string): AnyDoc[] => {
    if (!fs.existsSync(filePath)) {
        return [];
    }

    const result = spawnSync('bsondump', [filePath], { encoding: 'utf-8' });
    if (result.error) {
        throw new Error(`Failed to run bsondump: ${result.error.message}`);
    }

    if (result.status !== 0) {
        throw new Error(`bsondump failed: ${result.stderr || result.stdout}`);
    }

    const lines = result.stdout.split('\n').filter((line) => line.trim().length > 0);
    return lines.map((line) => EJSON.parse(line, { relaxed: true }));
};

const mapResourceType = (value?: string, isCertified?: boolean): 'Course' | 'Certification' | 'Book' | 'Project' => {
    const normalized = (value || '').toLowerCase();
    if (normalized.includes('cert') || isCertified) return 'Certification';
    if (normalized.includes('book') || normalized.includes('doc') || normalized.includes('livre')) return 'Book';
    if (normalized.includes('project') || normalized.includes('projet')) return 'Project';
    return 'Course';
};

const mapDifficulty = (value?: string): 'Beginner' | 'Intermediate' | 'Advanced' => {
    const normalized = (value || '').toLowerCase();
    if (normalized.includes('beginner') || normalized.includes('debut')) return 'Beginner';
    if (normalized.includes('advanced') || normalized.includes('expert') || normalized.includes('avance')) return 'Advanced';
    return 'Intermediate';
};

const normalizeKey = (value?: string) => (value || '').trim().toLowerCase();

const coerceObjectId = (value: any): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value._id) return String(value._id);
    return String(value);
};

const resolveSkillIds = (
    values: any[],
    codeToId: Map<string, string>,
    nameToId: Map<string, string>,
    idSet: Set<string>
) => {
    const resolved: string[] = [];

    values.forEach((raw) => {
        const rawValue = coerceObjectId(raw);
        if (!rawValue) return;

        if (idSet.has(rawValue)) {
            resolved.push(rawValue);
            return;
        }

        const byCode = codeToId.get(rawValue.toUpperCase());
        if (byCode) {
            resolved.push(byCode);
            return;
        }

        const byName = nameToId.get(normalizeKey(rawValue));
        if (byName) {
            resolved.push(byName);
        }
    });

    return resolved;
};

const loadSeedData = async (backupDir: string): Promise<{ source: SeedSource; data: AnyDoc[] }> => {
    const jsonPath = path.join(backupDir, 'resources.json');
    if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
            return { source: 'resources.json', data };
        }
    }

    const bsonPath = path.join(backupDir, 'resources.bson');
    if (fs.existsSync(bsonPath)) {
        const data = loadBson(bsonPath);
        if (data.length) {
            return { source: 'resources.bson', data };
        }
    }

    const formationsPath = path.join(backupDir, 'formations.bson');
    if (fs.existsSync(formationsPath)) {
        const data = loadBson(formationsPath);
        if (data.length) {
            return { source: 'formations.bson', data };
        }
    }

    return { source: 'resources.json', data: [] };
};

const seedResources = async () => {
    const backupDir = resolveBackupDir();

    console.log('Connecting to MongoDB...');
    await connectDatabase();

    const competences = await Competence.find().select('_id code name').lean();
    const codeToId = new Map<string, string>();
    const nameToId = new Map<string, string>();
    const idSet = new Set<string>();

    competences.forEach((competence: any) => {
        if (competence._id) idSet.add(competence._id.toString());
        if (competence.code) codeToId.set(String(competence.code).toUpperCase(), competence._id.toString());
        if (competence.name) nameToId.set(normalizeKey(competence.name), competence._id.toString());
    });

    const { source, data } = await loadSeedData(backupDir);
    if (!data.length) {
        throw new Error('No resource data found in backup_mars_2026.');
    }

    const limit = Number(process.env.RESOURCE_SEED_LIMIT || 0);
    const trimmed = limit > 0 ? data.slice(0, limit) : data;

    const resources = trimmed
        .map((doc) => {
            const type = mapResourceType(doc.type, doc.isCertified);
            const requiredSkills = resolveSkillIds(
                doc.requiredSkills || doc.coveredCompetences || [],
                codeToId,
                nameToId,
                idSet
            )
                .filter((id) => mongoose.Types.ObjectId.isValid(id))
                .map((id) => new mongoose.Types.ObjectId(id));

            const title = doc.title || doc.name;
            const description = doc.description || doc.summary || doc.title || doc.name;

            if (!title || !description) {
                return null;
            }

            const sourceType = source === 'formations.bson' ? 'Formation' : 'Resource';

            return {
                title,
                type,
                link: doc.link,
                description,
                requiredSkills,
                estimatedHours: Number(doc.estimatedHours || doc.duration || doc.estimatedDuration || 4),
                difficulty: mapDifficulty(doc.difficulty || doc.level),
                sourceId: doc._id,
                sourceType,
            };
        })
        .filter(Boolean) as Array<Record<string, any>>;

    if (!resources.length) {
        throw new Error('No valid resources could be mapped from the backup data.');
    }

    const operations = resources.map((resource) => ({
        updateOne: {
            filter: resource.sourceId
                ? { sourceId: resource.sourceId, sourceType: resource.sourceType }
                : { title: resource.title, type: resource.type },
            update: { $set: resource },
            upsert: true,
        },
    }));

    if (operations.length) {
        await Resource.bulkWrite(operations, { ordered: false });
    }

    console.log(`Seeded ${resources.length} resources from ${source}.`);

    await disconnectDatabase();
};

seedResources().catch(async (error) => {
    console.error('Resource seeding failed:', error instanceof Error ? error.message : String(error));
    await disconnectDatabase();
    process.exitCode = 1;
});
