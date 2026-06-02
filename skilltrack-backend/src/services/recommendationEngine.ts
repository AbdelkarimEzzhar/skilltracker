import mongoose from 'mongoose';
import {
    ActivityProfile,
    Competence,
    Goal,
    Recommendation,
    Resource,
    Specialty,
    StudentCompetence,
} from '../models';
import { Student } from '../models/User';

const GAP_THRESHOLD = 60;

const normalizeTokens = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);

const stopwords = new Set([
    'and', 'or', 'the', 'a', 'an', 'of', 'to', 'for', 'with', 'on', 'in', 'de', 'la', 'le', 'les', 'et', 'pour',
]);

const toLevelRank = (value?: string | null): number | null => {
    const normalized = (value || '').toLowerCase();
    if (!normalized) return null;

    if (
        normalized.includes('expert') ||
        normalized.includes('senior') ||
        normalized.includes('phd') ||
        normalized.includes('doctorat')
    ) {
        return 4;
    }

    if (
        normalized.includes('advanced') ||
        normalized.includes('avance') ||
        normalized.includes('master') ||
        normalized.includes('m2') ||
        normalized.includes('ine2')
    ) {
        return 3;
    }

    if (
        normalized.includes('intermediate') ||
        normalized.includes('intermediaire') ||
        normalized.includes('m1') ||
        normalized.includes('license 3') ||
        normalized.includes('licence 3') ||
        normalized.includes('l3')
    ) {
        return 2;
    }

    if (
        normalized.includes('beginner') ||
        normalized.includes('debutant') ||
        normalized.includes('novice') ||
        normalized.includes('l1') ||
        normalized.includes('l2') ||
        normalized.includes('1a')
    ) {
        return 1;
    }

    return null;
};

const normalizePriority = (value?: string | number) => {
    if (typeof value === 'number') return value;
    if (!value) return 2;
    const normalized = value.toString().toLowerCase();
    if (normalized.includes('high')) return 1;
    if (normalized.includes('low')) return 3;
    return 2;
};

const computePriority = (criticalMatchCount: number, missingMatchCount: number): 'High' | 'Medium' | 'Low' => {
    if (criticalMatchCount > 0) return 'High';
    if (missingMatchCount >= 2) return 'High';
    if (missingMatchCount === 1) return 'Medium';
    return 'Low';
};

const deriveCareerProfiles = (goalTitle?: string, specialtyTitle?: string) => {
    const roles = new Set<string>();
    if (goalTitle) roles.add(goalTitle);

    const title = (specialtyTitle || '').toLowerCase();
    const mappings: Array<[RegExp, string]> = [
        [/cloud/, 'Cloud Engineer'],
        [/devops/, 'DevOps Engineer'],
        [/data|big data|analytics/, 'Data Engineer'],
        [/iot|internet of things/, 'IoT Engineer'],
        [/cyber|security/, 'Cybersecurity Analyst'],
        [/software|web|mobile/, 'Software Engineer'],
    ];

    mappings.forEach(([pattern, role]) => {
        if (pattern.test(title)) roles.add(role);
    });

    return [...roles].filter(Boolean).slice(0, 3);
};

export const resolveGoalSkills = (
    goal: any,
    competences: any[],
    codeToId: Map<string, string>
): string[] => {
    const related = (goal?.relatedCompetences || []).map((id: any) => id.toString());
    if (related.length) return related;

    const tokens = normalizeTokens(`${goal?.title || ''} ${goal?.targetJobTitle || ''} ${goal?.description || ''}`)
        .filter((token) => token.length > 2 && !stopwords.has(token));

    if (!tokens.length) return [];

    return competences
        .filter((competence: any) => {
            const name = (competence.name || '').toLowerCase();
            const domain = (competence.domain || '').toLowerCase();
            return tokens.some((token) => name.includes(token) || domain.includes(token));
        })
        .sort((a: any, b: any) => (b.popularityScore || 0) - (a.popularityScore || 0))
        .slice(0, 12)
        .map((competence: any) => codeToId.get(competence.code) || competence._id.toString());
};

const resolveSpecialtySkills = (
    specialty: any | null,
    competences: any[],
    codeToId: Map<string, string>
): string[] => {
    if (specialty?.requiredSkills?.length) {
        return specialty.requiredSkills.map((id: any) => id.toString());
    }

    const tokens = normalizeTokens(`${specialty?.titre || ''} ${specialty?.description || ''}`)
        .filter((token) => token.length > 2 && !stopwords.has(token));

    if (!tokens.length) return [];

    return competences
        .filter((competence: any) => {
            const name = (competence.name || '').toLowerCase();
            const domain = (competence.domain || '').toLowerCase();
            return tokens.some((token) => name.includes(token) || domain.includes(token));
        })
        .sort((a: any, b: any) => (b.popularityScore || 0) - (a.popularityScore || 0))
        .slice(0, 12)
        .map((competence: any) => codeToId.get(competence.code) || competence._id.toString());
};

export const generateRecommendationsForStudent = async (studentId: string, force: boolean) => {
    const existing = await Recommendation.find({ userId: studentId });
    if (!force && existing.length > 0) {
        return { created: 0, updated: 0, total: existing.length };
    }

    const [student, goalsRaw, studentSkills, competences, resources, activityProfile] = await Promise.all([
        Student.findById(studentId).select('filiereId niveau'),
        Goal.find({ studentId }).select('relatedCompetences title description type targetJobTitle status priority'),
        StudentCompetence.find({ studentId }).lean(),
        Competence.find().select('_id code name domain popularityScore').lean(),
        Resource.find().lean(),
        ActivityProfile.findOne({ studentId }).lean(),
    ]);

    const specialty = student?.filiereId ? await Specialty.findById(student.filiereId).lean() : null;

    const goals = goalsRaw.filter((goal: any) => {
        const status = String(goal.status || '').toLowerCase();
        return !status.includes('completed') && !status.includes('done');
    });

    const codeToId = new Map<string, string>();
    const idToName = new Map<string, string>();
    const idToCompetence = new Map<string, any>();

    competences.forEach((competence: any) => {
        if (competence.code) codeToId.set(String(competence.code).toUpperCase(), competence._id.toString());
        if (competence._id) {
            const id = competence._id.toString();
            idToName.set(id, competence.name || competence.code);
            idToCompetence.set(id, competence);
        }
    });

    const sortedGoals = [...goals].sort((a: any, b: any) => normalizePriority(a.priority) - normalizePriority(b.priority));
    const careerGoals = sortedGoals.filter((goal: any) =>
        String(goal.type || '').toLowerCase().includes('career') || goal.targetJobTitle
    );

    const primaryGoal = careerGoals[0] || sortedGoals[0] || null;

    const goalSkillsById = new Map<string, string[]>();
    sortedGoals.forEach((goal: any) => {
        const goalId = goal?._id?.toString();
        if (!goalId) return;
        const skills = resolveGoalSkills(goal, competences, codeToId);
        if (skills.length) goalSkillsById.set(goalId, skills);
    });

    const allGoalSkillIds = [...new Set([...goalSkillsById.values()].flat())].slice(0, 60);
    const specialtySkills = resolveSpecialtySkills(specialty, competences, codeToId);

    const progressMap = new Map<string, number>();
    const studentSkillIds = new Set<string>();
    studentSkills.forEach((skill: any) => {
        const id = skill.competenceId?.toString();
        if (!id) return;
        const progress = Math.min(100, Math.max(0, Number(skill.progressPercentage ?? skill.confidenceScore ?? 0)));
        progressMap.set(id, progress);
        studentSkillIds.add(id);
    });

    const baseTargetIds = allGoalSkillIds.length ? allGoalSkillIds : specialtySkills;
    const hasGoalTargets = baseTargetIds.length > 0;
    const targetSkillIds = new Set<string>(hasGoalTargets ? baseTargetIds : [...studentSkillIds]);

    const missingSkillIds = new Set<string>(
        [...targetSkillIds].filter((id) => !progressMap.has(id) || (progressMap.get(id) || 0) < GAP_THRESHOLD)
    );

    const profileTokens = new Set<string>();
    const pushTokens = (value?: string) => {
        normalizeTokens(value || '').forEach((token) => {
            if (token.length > 2 && !stopwords.has(token)) profileTokens.add(token);
        });
    };

    sortedGoals.forEach((goal: any) => {
        pushTokens(goal?.title);
        pushTokens(goal?.targetJobTitle);
        pushTokens(goal?.description);
    });
    pushTokens(specialty?.titre);
    pushTokens(specialty?.description);

    if (!hasGoalTargets) {
        studentSkillIds.forEach((id) => {
            const comp = idToCompetence.get(id);
            if (!comp) return;
            pushTokens(comp.name);
            pushTokens(comp.domain);
        });
    }

    const resourceDocs = resources;
    if (!resourceDocs.length) {
        return { created: 0, updated: 0, total: 0 };
    }

    const existingMap = new Map<string, any>();
    existing.forEach((rec: any) => {
        const key = `${rec.sourceType || 'Resource'}:${rec.sourceId || rec.title}:${rec.type}`;
        existingMap.set(key, rec);
    });

    const recommendations: any[] = [];

    const hasGap = missingSkillIds.size > 0;

    const goalMeta = sortedGoals.map((goal: any) => ({
        id: goal?._id?.toString(),
        title: goal?.title,
        targetJobTitle: goal?.targetJobTitle,
        priorityRank: normalizePriority(goal?.priority),
    }));

    const findBestGoalMatch = (requiredSkills: string[]) => {
        let best: { id: string; title?: string; targetJobTitle?: string; priorityRank: number; matchCount: number } | null = null;

        goalMeta.forEach((goal) => {
            if (!goal.id) return;
            const skills = goalSkillsById.get(goal.id) || [];
            if (!skills.length) return;
            const matchCount = requiredSkills.filter((id) => skills.includes(id)).length;
            if (!matchCount) return;

            if (!best || matchCount > best.matchCount || (matchCount === best.matchCount && goal.priorityRank < best.priorityRank)) {
                best = { ...goal, matchCount };
            }
        });

        return best;
    };

    resourceDocs.forEach((resource: any) => {
        const requiredSkills = (resource.requiredSkills || []).map((id: any) => id.toString());
        const missingMatches = requiredSkills.filter((id: string) => missingSkillIds.has(id));
        const targetHits = requiredSkills.filter((id: string) => targetSkillIds.has(id));
        const criticalMatches = missingMatches.filter((id: string) => targetSkillIds.has(id));
        const bestGoal = requiredSkills.length ? findBestGoalMatch(requiredSkills) : null;
        const goalLabel = bestGoal?.targetJobTitle || bestGoal?.title;

        const text = `${resource.title || ''} ${resource.description || ''}`.toLowerCase();
        const hasProfileMatch = [...profileTokens].some((token) => text.includes(token));

        if (!missingMatches.length) {
            if (hasGap && !hasProfileMatch) return;
            if (!hasGap && !hasProfileMatch && targetHits.length === 0) return;
        }

        const priority = computePriority(criticalMatches.length, missingMatches.length);
        const missingNames = missingMatches
            .map((id: string) => idToName.get(id) || id)
            .filter(Boolean)
            .slice(0, 3);

        const fallbackTargetIds = requiredSkills.length
            ? requiredSkills
            : [...targetSkillIds];
        const targetCompetenceIds = missingMatches.length
            ? missingMatches
            : fallbackTargetIds.slice(0, 3);
        const targetNames = targetCompetenceIds
            .map((id: string) => idToName.get(id) || id)
            .filter(Boolean)
            .slice(0, 3);

        let reason = 'Recommandation personnalisee basee sur votre profil.';
        if (missingNames.length && goalLabel) {
            reason = `Requis pour votre objectif: ${goalLabel}. Competences: ${missingNames.join(', ')}.`;
        } else if (missingNames.length) {
            reason = `Pour combler les ecarts sur: ${missingNames.join(', ')}.`;
        } else if (targetNames.length && goalLabel) {
            reason = `Pour renforcer votre objectif: ${goalLabel}. Competences: ${targetNames.join(', ')}.`;
        } else if (targetNames.length) {
            reason = `Pour renforcer: ${targetNames.join(', ')}.`;
        } else if (goalLabel) {
            reason = `Enrichissement recommande pour votre objectif: ${goalLabel}.`;
        } else if (specialty?.titre) {
            reason = `Enrichissement recommande pour la filiere ${specialty.titre}.`;
        }

        recommendations.push({
            userId: studentId,
            type: resource.type,
            title: resource.title,
            description: resource.description,
            link: resource.link,
            priority,
            estimatedHours: Number(resource.estimatedHours || 4),
            difficulty: resource.difficulty,
            reason,
            status: 'Active',
            isCompleted: false,
            progressPercent: 0,
            sourceId: resource._id,
            sourceType: resource.sourceType || 'Resource',
            targetCompetenceIds,
        });
    });

    const avgProgress = progressMap.size
        ? [...progressMap.values()].reduce((sum, value) => sum + value, 0) / progressMap.size
        : 0;
    const levelRank = toLevelRank(student?.niveau || null);
    const isIntermediate = avgProgress >= 60 || (levelRank !== null && levelRank >= 2) || (activityProfile?.level || 1) >= 2;

    if (isIntermediate) {
        const roles = deriveCareerProfiles(primaryGoal?.targetJobTitle || primaryGoal?.title, specialty?.titre);
        roles.forEach((role) => {
            recommendations.push({
                userId: studentId,
                type: 'CareerPath',
                title: role,
                description: 'Profil professionnel propose pour la suite de votre parcours.',
                priority: 'Medium',
                estimatedHours: Math.max(8, missingSkillIds.size * 3),
                difficulty: 'Intermediate',
                reason: 'Profil recommande apres niveau intermediaire.',
                status: 'Active',
                isCompleted: false,
                progressPercent: 0,
                sourceId: role,
                sourceType: 'CareerPath',
                targetCompetenceIds: missingSkillIds.size ? [...missingSkillIds] : [...targetSkillIds],
            });
        });
    }

    const operations: any[] = [];
    let created = 0;
    let updated = 0;

    const newKeys = new Set<string>();

    recommendations.forEach((rec) => {
        const key = `${rec.sourceType || 'Resource'}:${rec.sourceId || rec.title}:${rec.type}`;
        newKeys.add(key);

        const existingRec = existingMap.get(key);
        if (existingRec && ['Completed', 'Ignored'].includes(existingRec.status)) {
            return;
        }

        if (existingRec) {
            operations.push({
                updateOne: {
                    filter: { _id: existingRec._id },
                    update: {
                        $set: {
                            title: rec.title,
                            description: rec.description,
                            link: rec.link,
                            priority: rec.priority,
                            estimatedHours: rec.estimatedHours,
                            reason: rec.reason,
                            difficulty: rec.difficulty,
                            targetCompetenceIds: rec.targetCompetenceIds,
                        },
                    },
                },
            });
            updated += 1;
        } else {
            operations.push({
                updateOne: {
                    filter: { userId: rec.userId, sourceId: rec.sourceId, type: rec.type },
                    update: { $setOnInsert: rec },
                    upsert: true,
                },
            });
            created += 1;
        }
    });

    if (force) {
        const staleIds = existing
            .filter((rec: any) => rec.status === 'Active')
            .filter((rec: any) => {
                const key = `${rec.sourceType || 'Resource'}:${rec.sourceId || rec.title}:${rec.type}`;
                return !newKeys.has(key);
            })
            .map((rec: any) => rec._id)
            .filter(Boolean);

        if (staleIds.length) {
            operations.push({
                updateMany: {
                    filter: { _id: { $in: staleIds } },
                    update: { $set: { status: 'Ignored', isCompleted: false, progressPercent: 0 } },
                },
            });
        }
    }

    if (operations.length) {
        await Recommendation.bulkWrite(operations, { ordered: false });
    }

    return { created, updated, total: recommendations.length };
};

export const bumpSkillsFromRecommendation = async (
    studentId: string,
    recommendation: {
        targetCompetenceIds?: mongoose.Types.ObjectId[];
        difficulty?: string;
        estimatedHours?: number;
        sourceId?: mongoose.Types.ObjectId | string;
    }
) => {
    let targetIds = (recommendation.targetCompetenceIds || []).map((id) => id.toString());

    if (!targetIds.length && recommendation.sourceId) {
        const sourceId = recommendation.sourceId.toString();
        if (mongoose.Types.ObjectId.isValid(sourceId)) {
            const resource = await Resource.findById(sourceId).select('requiredSkills').lean();
            if (resource?.requiredSkills?.length) {
                targetIds = resource.requiredSkills.map((id: any) => id.toString());
            }
        }
    }

    if (!targetIds.length) return;

    const difficulty = (recommendation.difficulty || 'Intermediate').toLowerCase();
    const difficultyBoost = difficulty.includes('advanced') ? 20 : difficulty.includes('beginner') ? 10 : 15;

    await Promise.all(
        targetIds.map(async (competenceId) => {
            const existing = await StudentCompetence.findOne({ studentId, competenceId });
            const current = Math.min(
                100,
                Math.max(0, existing?.progressPercentage ?? existing?.confidenceScore ?? 0)
            );

            const nextProgress = Math.min(100, Math.max(current, GAP_THRESHOLD) + difficultyBoost);
            const nextStatus = nextProgress >= 80 ? 'Mastered' : 'In Progress';

            await StudentCompetence.findOneAndUpdate(
                { studentId, competenceId },
                {
                    $set: {
                        progressPercentage: nextProgress,
                        confidenceScore: nextProgress,
                        status: nextStatus,
                        lastPracticed: new Date(),
                    },
                    $inc: { practiceCount: 1 },
                },
                { new: true, upsert: true }
            );
        })
    );
};
