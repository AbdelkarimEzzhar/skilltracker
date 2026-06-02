import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from './src/config/database';
import { Competence, Resource } from './src/models';

dotenv.config();

const DEFAULT_RESOURCE_COUNT = 140;

const typeOptions = ['Course', 'Certification', 'Book', 'Project'] as const;

const courseTemplates = [
    'Foundations of {name}',
    'Hands-on {name} Workshop',
    '{name} in Practice',
    'Fast Track: {name}',
    '{name} Essentials',
];

const certificationTemplates = [
    'Certification Prep: {name}',
    '{name} Exam Readiness',
    'Validated {name} Skills',
    '{name} Professional Certification',
];

const bookTemplates = [
    'Guide to {name}',
    'The {name} Handbook',
    'Practical {name}',
    '{name} Field Manual',
];

const projectTemplates = [
    'Project: {name} Portfolio',
    'Build with {name}',
    '{name} Capstone Project',
    'Applied {name} Sprint',
];

const slugify = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

const mapDifficulty = (competence: any): 'Beginner' | 'Intermediate' | 'Advanced' => {
    const level = String(competence?.level || '').toLowerCase();
    const difficulty = Number(competence?.difficulty || 0);

    if (level.includes('expert') || level.includes('advanced') || level.includes('avance')) return 'Advanced';
    if (level.includes('beginner') || level.includes('debut') || level.includes('novice')) return 'Beginner';

    if (difficulty >= 7) return 'Advanced';
    if (difficulty > 0 && difficulty <= 3) return 'Beginner';
    return 'Intermediate';
};

const estimateHours = (type: typeof typeOptions[number], index: number) => {
    const base = 4 + (index % 6);
    if (type === 'Project') return 8 + (index % 10);
    if (type === 'Certification') return 10 + (index % 12);
    if (type === 'Book') return 5 + (index % 8);
    return 6 + (index % 10);
};

const pickTemplate = (type: typeof typeOptions[number], index: number) => {
    const lists: Record<typeof typeOptions[number], string[]> = {
        Course: courseTemplates,
        Certification: certificationTemplates,
        Book: bookTemplates,
        Project: projectTemplates,
    };

    const templates = lists[type];
    return templates[index % templates.length];
};

const buildResource = (competences: any[], index: number) => {
    const primary = competences[index % competences.length];
    const secondary = competences[(index * 7) % competences.length];

    const skillName = primary?.name || primary?.code || 'Skill';
    const domain = primary?.domain || 'General';
    const type = typeOptions[index % typeOptions.length];
    const template = pickTemplate(type, index);

    const title = template.replace('{name}', skillName).replace('{domain}', domain);
    const description =
        type === 'Project'
            ? `A guided project to apply ${skillName} in a realistic scenario.`
            : `A structured ${type.toLowerCase()} focused on ${skillName}, with exercises and review prompts.`;

    const requiredSkills = [primary._id];
    if (secondary && secondary._id && secondary._id.toString() !== primary._id.toString()) {
        requiredSkills.push(secondary._id);
    }

    const sourceId = `seed:${slugify(skillName)}:${index + 1}`;

    return {
        title,
        type,
        link: `https://example.com/learn/${slugify(skillName)}/${index + 1}`,
        description,
        requiredSkills,
        estimatedHours: estimateHours(type, index),
        difficulty: mapDifficulty(primary),
        sourceId,
        sourceType: 'Seeded',
    };
};

const seedExtraResources = async () => {
    console.log('Connecting to MongoDB...');
    await connectDatabase();

    const competences = await Competence.find().select('_id name code domain level difficulty').lean();
    if (!competences.length) {
        throw new Error('No competences found. Seed competences first.');
    }

    const count = Number(process.env.EXTRA_RESOURCE_COUNT || DEFAULT_RESOURCE_COUNT);
    const resources = Array.from({ length: count }, (_, index) => buildResource(competences, index));

    const operations = resources.map((resource) => ({
        updateOne: {
            filter: { sourceId: resource.sourceId, sourceType: resource.sourceType },
            update: { $set: resource },
            upsert: true,
        },
    }));

    if (operations.length) {
        await Resource.bulkWrite(operations, { ordered: false });
    }

    console.log(`Seeded ${resources.length} extra resources.`);
    await disconnectDatabase();
};

seedExtraResources().catch(async (error) => {
    console.error('Extra resource seeding failed:', error instanceof Error ? error.message : String(error));
    await disconnectDatabase();
    process.exitCode = 1;
});
