import { Competence, Resource } from '../models';

const DEFAULT_RESOURCE_TARGET = 160;

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

    const sourceId = `auto:${slugify(skillName)}:${index + 1}`;

    return {
        title,
        type,
        link: `https://example.com/learn/${slugify(skillName)}/${index + 1}`,
        description,
        requiredSkills,
        estimatedHours: estimateHours(type, index),
        difficulty: mapDifficulty(primary),
        sourceId,
        sourceType: 'AutoSeed',
    };
};

export const seedResourcesIfNeeded = async () => {
    const autoSeedRaw = (process.env.AUTO_RESOURCE_SEED || '').trim().toLowerCase();
    if (['0', 'false', 'off', 'no'].includes(autoSeedRaw)) {
        return { seeded: false, reason: 'disabled' } as const;
    }

    const targetCount = Math.max(1, Number(process.env.AUTO_RESOURCE_COUNT || DEFAULT_RESOURCE_TARGET));
    const existingAutoCount = await Resource.countDocuments({ sourceType: 'AutoSeed' });

    if (existingAutoCount >= targetCount) {
        return { seeded: false, reason: 'data-present', count: existingAutoCount } as const;
    }

    const competences = await Competence.find().select('_id name code domain level difficulty').lean();
    if (!competences.length) {
        return { seeded: false, reason: 'no-competences' } as const;
    }

    const totalToCreate = targetCount - existingAutoCount;
    const resources = Array.from({ length: totalToCreate }, (_, offset) =>
        buildResource(competences, existingAutoCount + offset)
    );

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

    return { seeded: true, count: resources.length } as const;
};
