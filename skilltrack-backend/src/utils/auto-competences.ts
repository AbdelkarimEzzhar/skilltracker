import { Competence } from '../models';

type SeedCompetence = {
    code: string;
    name: string;
    domain: string;
    category: string;
    level?: string;
    difficulty?: number;
    description?: string;
    tags?: string[];
    estimatedDuration?: number;
};

const DEFAULT_COMPETENCE_TARGET = 140;

const seedCompetences: SeedCompetence[] = [
    { code: 'WEB_HTML', name: 'HTML', domain: 'Web Development', category: 'Frontend' },
    { code: 'WEB_CSS', name: 'CSS', domain: 'Web Development', category: 'Frontend' },
    { code: 'WEB_JS', name: 'JavaScript', domain: 'Web Development', category: 'Frontend' },
    { code: 'WEB_TS', name: 'TypeScript', domain: 'Web Development', category: 'Frontend' },
    { code: 'WEB_REACT', name: 'React', domain: 'Web Development', category: 'Frontend', level: 'Intermediate' },
    { code: 'WEB_NEXT', name: 'Next.js', domain: 'Web Development', category: 'Frontend', level: 'Intermediate' },
    { code: 'WEB_ACCESS', name: 'Web Accessibility', domain: 'Web Development', category: 'Frontend' },
    { code: 'WEB_PERF', name: 'Web Performance', domain: 'Web Development', category: 'Frontend', level: 'Intermediate' },
    { code: 'BE_NODE', name: 'Node.js', domain: 'Backend', category: 'API' },
    { code: 'BE_EXPRESS', name: 'Express.js', domain: 'Backend', category: 'API' },
    { code: 'BE_NEST', name: 'NestJS', domain: 'Backend', category: 'API', level: 'Intermediate' },
    { code: 'BE_DJANGO', name: 'Django', domain: 'Backend', category: 'API' },
    { code: 'BE_FASTAPI', name: 'FastAPI', domain: 'Backend', category: 'API' },
    { code: 'BE_REST', name: 'REST API Design', domain: 'Backend', category: 'API' },
    { code: 'BE_GRAPHQL', name: 'GraphQL', domain: 'Backend', category: 'API', level: 'Intermediate' },
    { code: 'BE_MICRO', name: 'Microservices', domain: 'Backend', category: 'Architecture', level: 'Advanced', difficulty: 7 },
    { code: 'BE_SYSTEM', name: 'System Design', domain: 'Backend', category: 'Architecture', level: 'Advanced', difficulty: 8 },
    { code: 'DB_SQL', name: 'SQL', domain: 'Data', category: 'Database' },
    { code: 'DB_MONGO', name: 'MongoDB', domain: 'Data', category: 'Database' },
    { code: 'DB_POSTGRES', name: 'PostgreSQL', domain: 'Data', category: 'Database' },
    { code: 'DB_REDIS', name: 'Redis', domain: 'Data', category: 'Database', level: 'Intermediate' },
    { code: 'DATA_PY', name: 'Python for Data', domain: 'Data', category: 'Analytics' },
    { code: 'DATA_PANDAS', name: 'Pandas', domain: 'Data', category: 'Analytics' },
    { code: 'DATA_ETL', name: 'ETL Pipelines', domain: 'Data', category: 'Engineering', level: 'Intermediate' },
    { code: 'DATA_AIRFLOW', name: 'Airflow', domain: 'Data', category: 'Engineering', level: 'Intermediate' },
    { code: 'DATA_SPARK', name: 'Apache Spark', domain: 'Data', category: 'Engineering', level: 'Advanced', difficulty: 8 },
    { code: 'DATA_ANALYTICS', name: 'Data Analytics', domain: 'Data', category: 'Analytics' },
    { code: 'AI_ML', name: 'Machine Learning', domain: 'AI', category: 'Modeling', level: 'Intermediate', difficulty: 7 },
    { code: 'AI_LLM', name: 'Large Language Models', domain: 'AI', category: 'Modeling', level: 'Advanced', difficulty: 8 },
    { code: 'AI_PROMPT', name: 'Prompt Engineering', domain: 'AI', category: 'Applied' },
    { code: 'CLOUD_AWS', name: 'AWS Fundamentals', domain: 'Cloud', category: 'Platform' },
    { code: 'CLOUD_AZURE', name: 'Azure Fundamentals', domain: 'Cloud', category: 'Platform' },
    { code: 'CLOUD_GCP', name: 'GCP Fundamentals', domain: 'Cloud', category: 'Platform' },
    { code: 'DEVOPS_DOCKER', name: 'Docker', domain: 'DevOps', category: 'Containers' },
    { code: 'DEVOPS_K8S', name: 'Kubernetes', domain: 'DevOps', category: 'Containers', level: 'Advanced', difficulty: 7 },
    { code: 'DEVOPS_TF', name: 'Terraform', domain: 'DevOps', category: 'Infrastructure', level: 'Intermediate' },
    { code: 'DEVOPS_CICD', name: 'CI/CD', domain: 'DevOps', category: 'Automation' },
    { code: 'DEVOPS_LINUX', name: 'Linux Administration', domain: 'DevOps', category: 'Operations' },
    { code: 'DEVOPS_GIT', name: 'Git', domain: 'DevOps', category: 'Collaboration' },
    { code: 'DEVOPS_MON', name: 'Monitoring and Observability', domain: 'DevOps', category: 'Operations', level: 'Intermediate' },
    { code: 'SEC_APP', name: 'Application Security', domain: 'Security', category: 'Secure Coding', level: 'Intermediate' },
    { code: 'SEC_AUTH', name: 'Authentication and Authorization', domain: 'Security', category: 'Identity' },
    { code: 'SEC_OAUTH', name: 'OAuth and OIDC', domain: 'Security', category: 'Identity', level: 'Intermediate' },
    { code: 'SEC_PENTEST', name: 'Penetration Testing', domain: 'Security', category: 'Offense', level: 'Advanced', difficulty: 8 },
    { code: 'SEC_THREAT', name: 'Threat Modeling', domain: 'Security', category: 'Defense', level: 'Intermediate' },
    { code: 'QA_TEST', name: 'Software Testing', domain: 'Quality', category: 'QA' },
    { code: 'QA_AUTO', name: 'Test Automation', domain: 'Quality', category: 'QA', level: 'Intermediate' },
    { code: 'QA_JEST', name: 'Jest', domain: 'Quality', category: 'QA' },
    { code: 'QA_CYPRESS', name: 'Cypress', domain: 'Quality', category: 'QA', level: 'Intermediate' },
    { code: 'MOBILE_RN', name: 'React Native', domain: 'Mobile', category: 'Frontend', level: 'Intermediate' },
    { code: 'MOBILE_FLUTTER', name: 'Flutter', domain: 'Mobile', category: 'Frontend', level: 'Intermediate' },
    { code: 'DESIGN_UX', name: 'UX Design', domain: 'Design', category: 'Product' },
    { code: 'DESIGN_UI', name: 'UI Design', domain: 'Design', category: 'Product' },
    { code: 'DESIGN_FIGMA', name: 'Figma', domain: 'Design', category: 'Tools' },
    { code: 'DESIGN_PROTO', name: 'Prototyping', domain: 'Design', category: 'Product' },
    { code: 'PROD_DISCOVERY', name: 'Product Discovery', domain: 'Product', category: 'Strategy', level: 'Intermediate' },
    { code: 'PROD_ROADMAP', name: 'Product Roadmapping', domain: 'Product', category: 'Strategy', level: 'Intermediate' },
    { code: 'PROD_ANALYTICS', name: 'Product Analytics', domain: 'Product', category: 'Strategy', level: 'Intermediate' },
    { code: 'PM_AGILE', name: 'Agile Methodologies', domain: 'Project Management', category: 'Agile' },
    { code: 'PM_SCRUM', name: 'Scrum', domain: 'Project Management', category: 'Agile' },
    { code: 'PM_KANBAN', name: 'Kanban', domain: 'Project Management', category: 'Agile' },
    { code: 'PM_RISK', name: 'Risk Management', domain: 'Project Management', category: 'Governance' },
    { code: 'PM_STAKE', name: 'Stakeholder Management', domain: 'Project Management', category: 'Governance' },
    { code: 'SOFT_COMM', name: 'Communication', domain: 'Soft Skills', category: 'Collaboration' },
    { code: 'SOFT_TEAM', name: 'Teamwork', domain: 'Soft Skills', category: 'Collaboration' },
    { code: 'SOFT_LEAD', name: 'Leadership', domain: 'Soft Skills', category: 'Management' },
    { code: 'SOFT_PRESENT', name: 'Presentation', domain: 'Soft Skills', category: 'Communication' },
    { code: 'SOFT_CRIT', name: 'Critical Thinking', domain: 'Soft Skills', category: 'Cognition' },
    { code: 'SOFT_PROB', name: 'Problem Solving', domain: 'Soft Skills', category: 'Cognition' },
    { code: 'SOFT_TIME', name: 'Time Management', domain: 'Soft Skills', category: 'Organization' },
    { code: 'SOFT_NEG', name: 'Negotiation', domain: 'Soft Skills', category: 'Communication' },
];

const toTags = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);

const extraLabels = ['Foundations of', 'Applied', 'Advanced', 'Professional', 'Practical', 'Modern', 'Enterprise'];

const formatExtraName = (label: string, baseName: string) =>
    label.includes('of') ? `${label} ${baseName}` : `${label} ${baseName}`;

const resolveLevel = (label: string): string => {
    const normalized = label.toLowerCase();
    if (normalized.includes('advanced') || normalized.includes('enterprise')) return 'Advanced';
    if (normalized.includes('foundations')) return 'Beginner';
    return 'Intermediate';
};

const resolveDifficulty = (level: string): number => {
    const normalized = level.toLowerCase();
    if (normalized.includes('advanced')) return 7;
    if (normalized.includes('beginner')) return 3;
    return 5;
};

const buildCompetenceDoc = (seed: SeedCompetence) => {
    const rawTags = [...toTags(seed.name), ...toTags(seed.domain), ...toTags(seed.category)];
    const tags = Array.from(new Set(rawTags)).slice(0, 8);

    return {
        code: seed.code.toUpperCase(),
        name: seed.name,
        description:
            seed.description || `Foundational skill in ${seed.name} for ${seed.domain}.`,
        domain: seed.domain,
        category: seed.category,
        level: seed.level || 'Beginner',
        difficulty: seed.difficulty ?? 5,
        estimatedDuration: seed.estimatedDuration ?? 6,
        tags,
        popularityScore: 0,
    };
};

const buildExtraCompetenceDoc = (base: SeedCompetence, index: number) => {
    const label = extraLabels[index % extraLabels.length];
    const name = formatExtraName(label, base.name);
    const level = resolveLevel(label);
    const rawTags = [...toTags(name), ...toTags(base.domain), ...toTags(base.category)];
    const tags = Array.from(new Set(rawTags)).slice(0, 8);

    return {
        code: `EXT_${base.code}_${index + 1}`.toUpperCase(),
        name,
        description: `Extended learning track for ${base.name} in ${base.domain}.`,
        domain: base.domain,
        category: base.category,
        level,
        difficulty: resolveDifficulty(level),
        estimatedDuration: 8,
        tags,
        popularityScore: 0,
    };
};

export const seedCompetencesIfNeeded = async () => {
    const autoSeedRaw = (process.env.AUTO_COMPETENCE_SEED || '').trim().toLowerCase();
    if (['0', 'false', 'off', 'no'].includes(autoSeedRaw)) {
        return { seeded: false, reason: 'disabled' } as const;
    }

    const targetCount = Math.max(1, Number(process.env.AUTO_COMPETENCE_COUNT || DEFAULT_COMPETENCE_TARGET));

    const existingCount = await Competence.estimatedDocumentCount();
    if (existingCount >= targetCount) {
        return { seeded: false, reason: 'data-present', count: existingCount } as const;
    }

    const baseCount = Math.min(seedCompetences.length, targetCount);
    const entries = seedCompetences.slice(0, baseCount).map(buildCompetenceDoc);

    if (targetCount > seedCompetences.length) {
        const extraNeeded = targetCount - seedCompetences.length;
        for (let index = 0; index < extraNeeded; index += 1) {
            const base = seedCompetences[index % seedCompetences.length];
            entries.push(buildExtraCompetenceDoc(base, index));
        }
    }

    const operations = entries.map((entry) => ({
        updateOne: {
            filter: { code: entry.code },
            update: { $setOnInsert: entry },
            upsert: true,
        },
    }));

    if (operations.length) {
        await Competence.bulkWrite(operations, { ordered: false });
    }

    return { seeded: true, count: entries.length } as const;
};
