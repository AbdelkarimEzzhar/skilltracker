import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { EJSON } from 'bson';
import bcryptjs from 'bcryptjs';
import {
    User,
    Competence,
    StudentCompetence,
    Goal,
    Filiere,
    Formation,
    Achievement,
    ActivityProfile,
} from '../models';

type AnyDoc = Record<string, any>;

type AutoSeedMode = 'off' | 'if-empty' | 'always';

type SeedOptions = {
    backupDir?: string;
    ensureAdmin?: boolean;
    force?: boolean;
};

type SeedResult = {
    seeded: boolean;
    reason?: string;
    backupDir?: string;
};

const parseAutoSeedMode = (): AutoSeedMode => {
    const raw = (process.env.AUTO_SEED_FROM_BACKUP || '').trim().toLowerCase();

    if (!raw) {
        return process.env.NODE_ENV === 'production' ? 'off' : 'if-empty';
    }

    if (['0', 'false', 'off', 'no'].includes(raw)) {
        return 'off';
    }

    if (['always', 'force'].includes(raw)) {
        return 'always';
    }

    return 'if-empty';
};

const resolveBackupDir = (explicitDir?: string): string => {
    if (explicitDir) {
        return explicitDir;
    }

    if (process.env.SEED_BACKUP_DIR) {
        return process.env.SEED_BACKUP_DIR;
    }

    return path.resolve(process.cwd(), '..', 'backup_mars_2026', 'skilltrack');
};

const loadBson = (backupDir: string, fileName: string): AnyDoc[] => {
    const filePath = path.join(backupDir, fileName);

    if (!fs.existsSync(filePath)) {
        throw new Error(`Backup file not found: ${filePath}`);
    }

    const result = spawnSync('bsondump', [filePath], { encoding: 'utf-8' });

    if (result.error) {
        throw new Error(`Failed to run bsondump for ${fileName}: ${result.error.message}`);
    }

    if (result.status !== 0) {
        throw new Error(`bsondump failed for ${fileName}: ${result.stderr || result.stdout}`);
    }

    const lines = result.stdout.split('\n').filter((line) => line.trim().length > 0);
    return lines.map((line) => EJSON.parse(line, { relaxed: true }));
};

const normalizeRole = (role?: string): 'ADMIN' | 'STUDENT' => {
    if (!role) return 'STUDENT';
    return role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STUDENT';
};

const normalizeStatus = (isActive?: boolean): 'active' | 'inactive' => {
    return isActive === false ? 'inactive' : 'active';
};

const mapGoalStatus = (status?: string): string => {
    if (!status) return 'Not Started';
    const normalized = status.toLowerCase();
    if (normalized.includes('cours')) return 'In Progress';
    if (normalized.includes('faire')) return 'Not Started';
    if (normalized.includes('term')) return 'Completed';
    if (normalized.includes('aband')) return 'Abandoned';
    return status;
};

const mapGoalType = (type?: string): string => {
    if (!type) return 'Learning';
    const normalized = type.toLowerCase();
    if (normalized.includes('projet')) return 'Project';
    if (normalized.includes('cert')) return 'Certification';
    if (normalized.includes('comp')) return 'Learning';
    return type;
};

const mapPriority = (priority?: number | string): string | number => {
    if (typeof priority === 'number') {
        if (priority === 1) return 'High';
        if (priority === 2) return 'Medium';
        if (priority === 3) return 'Low';
    }
    return priority ?? 'Medium';
};

const mapSkillStatus = (status?: string): string => {
    if (!status) return 'Not Started';
    const normalized = status.toLowerCase();
    if (normalized.includes('master')) return 'Mastered';
    if (normalized.includes('progress')) return 'In Progress';
    if (normalized.includes('acquir')) return 'Reviewed';
    return status;
};

const upsertMany = async (model: any, docs: AnyDoc[], label: string) => {
    if (!docs.length) {
        console.log(`${label}: no documents found`);
        return;
    }

    const operations = docs.map((doc) => ({
        updateOne: {
            filter: { _id: doc._id },
            update: { $set: doc },
            upsert: true,
        },
    }));

    await model.bulkWrite(operations, { ordered: false });
    console.log(`${label}: upserted ${docs.length} documents`);
};

const isDatabaseEmpty = async (): Promise<boolean> => {
    const [userCount, competenceCount, filiereCount] = await Promise.all([
        User.estimatedDocumentCount(),
        Competence.estimatedDocumentCount(),
        Filiere.estimatedDocumentCount(),
    ]);

    return userCount === 0 && competenceCount === 0 && filiereCount === 0;
};

export const ensureAdminUser = async () => {
    const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@skilltrack.com').toLowerCase();
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
        return { created: false, email: adminEmail };
    }

    const adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        username: 'admin',
        password: adminPassword,
        role: 'ADMIN',
        status: 'active',
    });

    await adminUser.save();

    const existingProfile = await ActivityProfile.findOne({ studentId: adminUser._id });
    if (!existingProfile) {
        const activityProfile = new ActivityProfile({
            studentId: adminUser._id,
            level: 1,
            experiencePoints: 0,
            currentStreakDays: 0,
            longestStreakDays: 0,
            totalHours: 0,
            totalActivities: 0,
            lastActivityDate: new Date(),
        });

        await activityProfile.save();
    }

    return { created: true, email: adminEmail, password: adminPassword };
};

export const seedFromBackup = async (options: SeedOptions = {}): Promise<SeedResult> => {
    const backupDir = resolveBackupDir(options.backupDir);

    if (!fs.existsSync(backupDir)) {
        throw new Error(`Backup directory not found: ${backupDir}`);
    }

    const usersRaw = loadBson(backupDir, 'users.bson');
    const competencesRaw = loadBson(backupDir, 'competences.bson');
    const filieresRaw = loadBson(backupDir, 'filieres.bson');
    const formationsRaw = loadBson(backupDir, 'formations.bson');
    const goalsRaw = loadBson(backupDir, 'goals.bson');
    const studentCompetencesRaw = loadBson(backupDir, 'student_competences.bson');
    const achievementsRaw = loadBson(backupDir, 'achievements.bson');
    const activityProfilesRaw = loadBson(backupDir, 'activity_profiles.bson');

    const users = usersRaw.map((doc) => {
        const role = normalizeRole(doc.role);
        const status = normalizeStatus(doc.is_active);
        const password = doc.password_hash || doc.password || bcryptjs.hashSync('Admin@123', 10);

        return {
            _id: doc._id,
            firstName: doc.firstName || doc.prenom || 'Unknown',
            lastName: doc.lastName || doc.nom || 'Unknown',
            email: doc.email?.toLowerCase(),
            username: doc.username?.toLowerCase() || doc.email?.split('@')[0],
            password,
            role,
            status,
            emailVerified: !!doc.email_verified,
            profileCompleted: !!doc.profile_completed,
            onboardingCompleted: !!doc.onboarding_completed,
            bio: doc.bio,
            filiereId: doc.filiereId,
            niveau: doc.niveau,
            __t: role === 'STUDENT' ? 'Student' : undefined,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
    });

    const competences = competencesRaw.map((doc) => ({
        _id: doc._id,
        code: doc.code,
        name: doc.name,
        description: doc.description,
        detailedDescription: doc.detailedDescription,
        domain: doc.domain,
        category: doc.category,
        level: doc.level,
        difficulty: doc.difficulty ?? 5,
        estimatedDuration: doc.estimatedDuration,
        tags: doc.tags || [],
        language: doc.language,
        popularityScore: doc.popularityScore ?? 0,
        institutionId: doc.institutionId,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    }));

    const filieres = filieresRaw.map((doc) => ({
        _id: doc._id,
        titre: doc.titre,
        description: doc.description,
        abbreviation: doc.abbreviation,
        isActive: doc.isActive ?? true,
        anneeCreation: doc.anneeCreation,
        requiredCredits: doc.requiredCredits,
        language: doc.language,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    }));

    const formations = formationsRaw.map((doc) => ({
        _id: doc._id,
        title: doc.title,
        description: doc.description,
        type: doc.type,
        level: doc.level,
        platform: doc.platform,
        link: doc.link,
        isCertified: doc.isCertified ?? false,
        duration: doc.duration,
        averageRating: doc.averageRating,
        studentCount: doc.studentCount,
        coveredCompetences: doc.coveredCompetences || [],
        costType: doc.costType,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    }));

    const goals = goalsRaw.map((doc) => ({
        _id: doc._id,
        studentId: doc.studentId || doc.user_id,
        title: doc.title,
        description: doc.description,
        type: mapGoalType(doc.type),
        status: mapGoalStatus(doc.status),
        priority: mapPriority(doc.priority),
        deadline: doc.deadline,
        progress: doc.progress ?? 0,
        relatedCompetences: doc.relatedCompetences || [],
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    }));

    const studentCompetences = studentCompetencesRaw.map((doc) => ({
        _id: doc._id,
        studentId: doc.studentId,
        competenceId: doc.competenceId,
        status: mapSkillStatus(doc.status),
        confidenceScore: doc.confidenceScore ?? 0,
        progressPercentage: doc.progressPercentage ?? doc.confidenceScore ?? 0,
        practiceCount: doc.practiceCount ?? 0,
        lastPracticed: doc.lastPracticed,
        assessmentDate: doc.assessmentDate,
        notes: doc.notes,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    }));

    const achievements = achievementsRaw.map((doc) => ({
        _id: doc._id,
        studentId: doc.studentId || doc.user_id,
        title: doc.title,
        description: doc.description,
        icon: doc.icon,
        category: doc.category,
        rarity: doc.rarity,
        points: doc.points ?? 10,
        unlockedAt: doc.unlockedAt || doc.unlocked_at,
        relatedCompetence: doc.relatedCompetence,
        requirements: doc.requirements,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    }));

    const activityProfiles = activityProfilesRaw.map((doc) => ({
        _id: doc._id,
        studentId: doc.studentId,
        level: doc.level ?? 1,
        experiencePoints: doc.experiencePoints ?? 0,
        currentStreakDays: doc.currentStreakDays ?? 0,
        longestStreakDays: doc.longestStreakDays ?? 0,
        totalHours: doc.totalHours ?? 0,
        lastActivityDate: doc.lastActivityDate,
        totalActivities: doc.totalActivities ?? 0,
        activityHistory: doc.activityHistory || [],
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    }));

    await upsertMany(User, users, 'Users');
    await upsertMany(Competence, competences, 'Competences');
    await upsertMany(Filiere, filieres, 'Filieres');
    await upsertMany(Formation, formations, 'Formations');
    await upsertMany(Goal, goals, 'Goals');
    await upsertMany(StudentCompetence, studentCompetences, 'Student Competences');
    await upsertMany(Achievement, achievements, 'Achievements');
    await upsertMany(ActivityProfile, activityProfiles, 'Activity Profiles');

    if (options.ensureAdmin !== false) {
        await ensureAdminUser();
    }

    return { seeded: true, backupDir };
};

export const seedFromBackupIfNeeded = async (options: SeedOptions = {}): Promise<SeedResult> => {
    const mode = parseAutoSeedMode();

    if (!options.force && mode === 'off') {
        return { seeded: false, reason: 'auto-seed-disabled' };
    }

    const shouldSeed =
        options.force ||
        mode === 'always' ||
        (mode === 'if-empty' && (await isDatabaseEmpty()));

    if (!shouldSeed) {
        return { seeded: false, reason: 'data-present' };
    }

    return seedFromBackup(options);
};
