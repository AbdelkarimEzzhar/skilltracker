import { Request, Response } from 'express';
import {
    ActivityProfile,
    StudentCompetence,
    Goal,
    Formation,
    Competence,
    Recommendation,
    AIRecommendationModel,
    Filiere,
    AcademicRecord,
    Achievement,
} from '../models';
import { User, Student } from '../models/User';
import { AuthRequest } from '../types';

const parseGradeTo20 = (value?: string | number | null): number | null => {
    if (value === undefined || value === null) return null;

    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return null;
        return Math.max(0, Math.min(20, value));
    }

    const trimmed = value.trim();
    if (!trimmed) return null;

    const match = trimmed.match(/^(\d+(?:[.,]\d+)?)(?:\s*\/\s*(\d+(?:[.,]\d+)?))?$/);
    if (!match) return null;

    const grade = Number(match[1].replace(',', '.'));
    const scale = match[2] ? Number(match[2].replace(',', '.')) : 20;

    if (!Number.isFinite(grade) || !Number.isFinite(scale) || scale <= 0) return null;

    return Math.max(0, Math.min(20, (grade / scale) * 20));
};

/**
 * Get Student Dashboard
 * Returns XP, level, streaks, and recent activity
 */
export const getStudentDashboard = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId as string;

        const activityProfile = await ActivityProfile.findOne({ studentId });
        const totalSkills = await StudentCompetence.countDocuments({ studentId });
        const masteredSkills = await StudentCompetence.countDocuments({ studentId, status: 'Mastered' });
        const inProgressSkills = await StudentCompetence.countDocuments({ studentId, status: 'In Progress' });
        const activeGoals = await Goal.countDocuments({ studentId, status: 'In Progress' });
        const completedGoals = await Goal.countDocuments({ studentId, status: 'Completed' });

        res.status(200).json({
            success: true,
            data: {
                profile: activityProfile,
                skills: {
                    total: totalSkills,
                    mastered: masteredSkills,
                    inProgress: inProgressSkills,
                },
                goals: {
                    active: activeGoals,
                    completed: completedGoals,
                },
            },
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch dashboard',
            statusCode: 500,
        });
    }
};

/**
 * Get Student Skills with Progress
 */
export const getStudentSkills = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId as string;
        const { status, page = 1, limit = 10 } = req.query;

        const filter: any = { studentId };
        if (status) filter.status = status;

        const skip = ((page as number) - 1) * (limit as number);
        const skills = await StudentCompetence.find(filter)
            .populate('competenceId')
            .skip(skip)
            .limit(limit as number);

        const total = await StudentCompetence.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                skills,
                pagination: { total, page, limit, pages: Math.ceil(total / (limit as number)) },
            },
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch skills',
            statusCode: 500,
        });
    }
};

/**
 * Add or Update Student Skill
 */
export const updateStudentSkill = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId as string;
        if (!studentId) {
            res.status(401).json({ error: 'Unauthorized', statusCode: 401 });
            return;
        }
        const { competenceId, status, confidenceScore, progressPercentage, notes } = req.body;

        if (!competenceId) {
            res.status(400).json({ error: 'Competence ID is required', statusCode: 400 });
            return;
        }

        const normalizeStatus = (value: string) => {
            const normalized = value.toLowerCase();
            if (normalized.includes('master')) return 'Mastered';
            if (normalized.includes('progress')) return 'In Progress';
            if (normalized.includes('review') || normalized.includes('acquir')) return 'Reviewed';
            if (normalized.includes('not')) return 'Not Started';
            return value;
        };

        const existingSkill = await StudentCompetence.findOne({ studentId, competenceId });
        const previousProgress = Math.min(
            100,
            Math.max(
                0,
                existingSkill?.progressPercentage ?? existingSkill?.confidenceScore ?? 0
            )
        );

        const updateData: any = {};
        if (status) updateData.status = normalizeStatus(status);
        if (confidenceScore !== undefined) updateData.confidenceScore = Math.min(100, Math.max(0, confidenceScore));
        if (progressPercentage !== undefined) {
            updateData.progressPercentage = Math.min(100, Math.max(0, progressPercentage));
        } else if (confidenceScore !== undefined) {
            updateData.progressPercentage = Math.min(100, Math.max(0, confidenceScore));
        }
        if (notes) updateData.notes = notes;
        updateData.lastPracticed = new Date();

        let studentSkill = await StudentCompetence.findOneAndUpdate(
            { studentId, competenceId },
            { $set: updateData, $inc: { practiceCount: 1 } },
            { new: true, upsert: true }
        ).populate('competenceId');

        const allSkills = await StudentCompetence.find({ studentId }).select('progressPercentage confidenceScore');
        const totalProgress = allSkills.reduce((sum, skill) => {
            const value = skill.progressPercentage ?? skill.confidenceScore ?? 0;
            const clamped = Math.min(100, Math.max(0, value));
            return sum + clamped;
        }, 0);

        const existingProfile = await ActivityProfile.findOne({ studentId });
        const bonusXp = existingProfile?.bonusExperiencePoints || 0;
        const totalXp = totalProgress + bonusXp;
        const previousXp = existingProfile?.experiencePoints || 0;
        const delta = Math.floor(totalXp - previousXp);
        const now = new Date();

        const profile = await ActivityProfile.findOneAndUpdate(
            { studentId },
            {
                $set: { experiencePoints: totalXp, lastActivityDate: now },
                ...(delta > 0
                    ? {
                        $inc: { totalActivities: 1 },
                        $push: { activityHistory: { date: now, activity: 'Skill Progress', pointsEarned: delta } },
                    }
                    : {}),
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        const nextLevel = Math.floor((profile?.experiencePoints || 0) / 100) + 1;
        if (profile && profile.level !== nextLevel) {
            profile.level = nextLevel;
            await profile.save();
        }

        await generateRecommendationsForStudent(studentId, true);

        res.status(200).json({
            success: true,
            data: studentSkill,
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to update skill',
            statusCode: 500,
        });
    }
};

/**
 * Get Student Goals
 */
export const getStudentGoals = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId as string;
        const { status, page = 1, limit = 10 } = req.query;

        const filter: any = { studentId };
        if (status) filter.status = status;

        const skip = ((page as number) - 1) * (limit as number);
        const goals = await Goal.find(filter)
            .populate('relatedCompetences')
            .sort({ deadline: 1 })
            .skip(skip)
            .limit(limit as number);

        const total = await Goal.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                goals,
                pagination: { total, page, limit, pages: Math.ceil(total / (limit as number)) },
            },
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch goals',
            statusCode: 500,
        });
    }
};

/**
 * Create Student Goal
 */
export const createStudentGoal = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId;
        if (!studentId) {
            res.status(401).json({ error: 'Unauthorized', statusCode: 401 });
            return;
        }
        const { title, description, type, deadline, relatedCompetences, priority, status } = req.body;

        if (!title || !deadline) {
            res.status(400).json({
                error: 'Title and deadline are required',
                statusCode: 400,
            });
            return;
        }

        const goal = await Goal.create({
            studentId,
            title,
            description,
            type: type || 'Learning',
            deadline: new Date(deadline),
            relatedCompetences: relatedCompetences || [],
            status: status || 'Not Started',
            priority: priority || 'Medium',
            progress: 0,
        });

        await generateRecommendationsForStudent(studentId, true);

        res.status(201).json({
            success: true,
            data: goal,
            statusCode: 201,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to create goal',
            statusCode: 500,
        });
    }
};

/**
 * Update Student Goal
 */
export const updateStudentGoal = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId;
        if (!studentId) {
            res.status(401).json({ error: 'Unauthorized', statusCode: 401 });
            return;
        }
        const { id } = req.params;
        const { title, description, type, deadline, relatedCompetences, status, priority, progress } = req.body;

        const updateData: any = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (type) updateData.type = type;
        if (deadline) updateData.deadline = new Date(deadline);
        if (relatedCompetences) updateData.relatedCompetences = relatedCompetences;
        if (status) updateData.status = status;
        if (priority !== undefined) updateData.priority = priority;
        if (progress !== undefined) updateData.progress = Math.min(100, Math.max(0, progress));

        const goal = await Goal.findOneAndUpdate({ _id: id, studentId }, updateData, { new: true });

        if (!goal) {
            res.status(404).json({ error: 'Goal not found', statusCode: 404 });
            return;
        }

        await generateRecommendationsForStudent(studentId, true);

        res.status(200).json({
            success: true,
            data: goal,
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to update goal',
            statusCode: 500,
        });
    }
};

/**
 * Delete Student Goal
 */
export const deleteStudentGoal = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId;
        if (!studentId) {
            res.status(401).json({ error: 'Unauthorized', statusCode: 401 });
            return;
        }
        const { id } = req.params;

        const goal = await Goal.findOneAndDelete({ _id: id, studentId });

        if (!goal) {
            res.status(404).json({ error: 'Goal not found', statusCode: 404 });
            return;
        }

        await generateRecommendationsForStudent(studentId, true);

        res.status(200).json({
            success: true,
            data: { message: 'Goal deleted successfully' },
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to delete goal',
            statusCode: 500,
        });
    }
};

/**
 * Get Student Academic Records
 */
export const getStudentAcademicRecords = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId as string;
        if (!studentId) {
            res.status(401).json({ error: 'Unauthorized', statusCode: 401 });
            return;
        }

        const records = await AcademicRecord.find({ userId: studentId })
            .sort({ semester: -1, createdAt: -1 })
            .lean();

        const allCourses = records.flatMap((record: any) => record.courses || []);
        const gradedCourses = allCourses
            .map((course: any) => parseGradeTo20(course.grade))
            .filter((grade: number | null): grade is number => grade !== null);

        const totalCredits = allCourses.reduce((sum: number, course: any) => {
            const credits = Number(course.credits);
            return sum + (Number.isFinite(credits) ? credits : 0);
        }, 0);

        const averageGrade = gradedCourses.length
            ? Math.round((gradedCourses.reduce((sum, grade) => sum + grade, 0) / gradedCourses.length) * 100) / 100
            : null;

        const coursesInProgress = allCourses.filter((course: any) => parseGradeTo20(course.grade) === null).length;

        res.status(200).json({
            success: true,
            data: {
                records,
                stats: {
                    totalSemesters: records.length,
                    totalCourses: allCourses.length,
                    totalCredits,
                    averageGrade,
                    coursesInProgress,
                },
            },
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch academic records',
            statusCode: 500,
        });
    }
};

/**
 * Add a Course to Student Academic Record
 */
export const addStudentAcademicCourse = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId as string;
        if (!studentId) {
            res.status(401).json({ error: 'Unauthorized', statusCode: 401 });
            return;
        }

        const { semester, title, grade, credits, linkedSkills } = req.body;

        if (!semester || !title) {
            res.status(400).json({ error: 'Semester and course title are required', statusCode: 400 });
            return;
        }

        const normalizedSemester = String(semester).trim();
        const normalizedTitle = String(title).trim();
        const sanitizedLinkedSkills = Array.isArray(linkedSkills) ? linkedSkills : [];

        const coursePayload: any = {
            title: normalizedTitle,
        };

        if (grade !== undefined && grade !== null && String(grade).trim()) {
            coursePayload.grade = String(grade).trim();
        }

        if (credits !== undefined && credits !== null && String(credits).trim() !== '') {
            const parsedCredits = Number(credits);
            if (Number.isFinite(parsedCredits) && parsedCredits >= 0) {
                coursePayload.credits = parsedCredits;
            }
        }

        if (sanitizedLinkedSkills.length > 0) {
            coursePayload.linkedSkills = sanitizedLinkedSkills;
        }

        const updateQuery: any = {
            $setOnInsert: {
                userId: studentId,
                semester: normalizedSemester,
                linkedSkills: sanitizedLinkedSkills,
            },
            $push: {
                courses: coursePayload,
            },
        };

        if (sanitizedLinkedSkills.length > 0) {
            updateQuery.$addToSet = {
                linkedSkills: { $each: sanitizedLinkedSkills },
            };
        }

        const record = await AcademicRecord.findOneAndUpdate(
            { userId: studentId, semester: normalizedSemester },
            updateQuery,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(201).json({
            success: true,
            data: record,
            statusCode: 201,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to add academic course',
            statusCode: 500,
        });
    }
};

/**
 * Get Student Achievements
 */
export const getStudentAchievements = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId as string;
        if (!studentId) {
            res.status(401).json({ error: 'Unauthorized', statusCode: 401 });
            return;
        }

        const { limit = 50 } = req.query;
        const limitNumber = Math.max(1, Math.min(200, Number(limit) || 50));

        const achievements = await Achievement.find({ studentId })
            .sort({ unlockedAt: -1, createdAt: -1 })
            .limit(limitNumber)
            .lean();

        const totalPoints = achievements.reduce((sum: number, achievement: any) => {
            const points = Number(achievement.points);
            return sum + (Number.isFinite(points) ? points : 0);
        }, 0);

        res.status(200).json({
            success: true,
            data: {
                achievements,
                stats: {
                    total: achievements.length,
                    totalPoints,
                    latestUnlockedAt: achievements[0]?.unlockedAt || null,
                },
            },
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch achievements',
            statusCode: 500,
        });
    }
};

/**
 * Get Student Profile
 */
export const getStudentProfile = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        const user = await User.findById(userId).select('-password');

        if (!user) {
            res.status(404).json({ error: 'User not found', statusCode: 404 });
            return;
        }

        res.status(200).json({
            success: true,
            data: user,
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch profile',
            statusCode: 500,
        });
    }
};

/**
 * Update Student Profile
 */
export const updateStudentProfile = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const {
            firstName,
            lastName,
            bio,
            filiereId,
            niveau,
            location,
            phone,
            linkedinUrl,
            githubUrl,
        } = req.body;

        const updateData: any = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (bio !== undefined) updateData.bio = bio;
        if (filiereId !== undefined) updateData.filiereId = filiereId || null;
        if (niveau !== undefined) updateData.niveau = niveau;
        if (location !== undefined) updateData.location = location;
        if (phone !== undefined) updateData.phone = phone;
        if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
        if (githubUrl !== undefined) updateData.githubUrl = githubUrl;

        const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');

        if (!user) {
            res.status(404).json({ error: 'User not found', statusCode: 404 });
            return;
        }

        if (userId) {
            await generateRecommendationsForStudent(userId, true);
        }

        res.status(200).json({
            success: true,
            data: user,
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to update profile',
            statusCode: 500,
        });
    }
};

/**
 * Get Career Roadmap
 * Suggests skills and formations based on goals
 */
export const getCareerRoadmap = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId;

        const goals = await Goal.find({ studentId }).populate('relatedCompetences').sort({ deadline: 1 });
        const studentSkills = await StudentCompetence.find({ studentId });
        const masteredSkillIds = studentSkills
            .filter((s) => s.status === 'Mastered')
            .map((s) => s.competenceId.toString());

        const roadmap = goals.map((goal, index) => {
            const requiredSkills = (goal.relatedCompetences || [])
                .filter((c: any) => !masteredSkillIds.includes(c._id.toString()))
                .map((c: any) => ({ name: c.name || c.code || 'Skill', priority: goal.priority || 'Medium' }));

            const deadline = goal.deadline ? new Date(goal.deadline) : null;
            const monthsLeft = deadline ? Math.max(1, Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))) : 3;

            return {
                phase: index + 1,
                goalId: goal._id.toString(),
                title: goal.title,
                description: goal.description || '',
                status: goal.status || 'Not Started',
                progress: Math.max(0, Math.min(100, Number(goal.progress || 0))),
                skills: requiredSkills,
                duration: `${monthsLeft} months`,
            };
        });

        res.status(200).json({
            success: true,
            data: { roadmap },
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch roadmap',
            statusCode: 500,
        });
    }
};

const normalizeTokens = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);

const stopwords = new Set([
    'and', 'or', 'the', 'a', 'an', 'of', 'to', 'for', 'with', 'on', 'in', 'de', 'la', 'le', 'les', 'et',
]);

const mapFormationType = (value?: string): 'Course' | 'Certification' | 'Book' | 'Project' | 'CareerPath' => {
    const normalized = (value || '').toLowerCase();
    if (normalized.includes('cert')) return 'Certification';
    if (normalized.includes('book') || normalized.includes('doc')) return 'Book';
    if (normalized.includes('project') || normalized.includes('projet')) return 'Project';
    return 'Course';
};

const computePriority = (hasGoalMatch: boolean, missingCount: number, profileHits: number): 'High' | 'Medium' | 'Low' => {
    if (hasGoalMatch && missingCount > 0) return 'High';
    if (profileHits >= 2 && missingCount > 0) return 'High';
    if (missingCount >= 2) return 'High';
    if (profileHits >= 2) return 'Medium';
    if (missingCount === 1 || hasGoalMatch) return 'Medium';
    return 'Low';
};

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

const AI_MODEL_KEY = 'default';
const AI_MODEL_VERSION = '1.1.0';
const AI_MODEL_MAX_AGE_MS = 1000 * 60 * 60 * 12; // 12h
const AI_MIN_TRAINING_SAMPLES = 20;
const AI_FEATURE_NAMES = [
    'goalMatch',
    'missingCoverage',
    'keywordAffinity',
    'profileAffinity',
    'levelFit',
    'timelineFit',
] as const;

type AIFeatureName = typeof AI_FEATURE_NAMES[number];
type AIFeatureVector = Record<AIFeatureName, number>;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const sigmoid = (value: number) => {
    if (value > 20) return 1;
    if (value < -20) return 0;
    return 1 / (1 + Math.exp(-value));
};

const dotProduct = (weights: number[], vector: number[]) =>
    vector.reduce((sum, value, index) => sum + value * (weights[index] || 0), 0);

const toAIFeatures = (params: {
    hasGoalMatch: boolean;
    missingCount: number;
    keywordHits: number;
    profileHits: number;
    levelScore: number;
    timelineScore: number;
}): AIFeatureVector => {
    const { hasGoalMatch, missingCount, keywordHits, profileHits, levelScore, timelineScore } = params;

    return {
        goalMatch: hasGoalMatch ? 1 : 0,
        missingCoverage: clamp01(missingCount / 4),
        keywordAffinity: clamp01(keywordHits / 4),
        profileAffinity: clamp01(profileHits / 4),
        levelFit: clamp01((levelScore + 1) / 3), // maps [-1,2] to [0,1]
        timelineFit: timelineScore > 0 ? 1 : timelineScore < 0 ? 0 : 0.5,
    };
};

const featuresToVector = (features: Partial<Record<string, number>>): number[] =>
    AI_FEATURE_NAMES.map((featureName) => clamp01(Number(features[featureName] || 0)));

const predictRecommendationProbability = (
    model: { weights?: number[]; bias?: number } | null,
    features: AIFeatureVector
) => {
    if (!model || !Array.isArray(model.weights) || model.weights.length !== AI_FEATURE_NAMES.length) {
        return 0.5;
    }

    const vector = featuresToVector(features);
    const z = dotProduct(model.weights, vector) + Number(model.bias || 0);
    return sigmoid(z);
};

const trainRecommendationModelInternal = async (force: boolean) => {
    const samples = await Recommendation.find({
        status: { $in: ['Completed', 'Ignored'] },
        aiFeatures: { $exists: true },
    })
        .select('status aiFeatures')
        .lean();

    if (samples.length < AI_MIN_TRAINING_SAMPLES) {
        return {
            trained: false,
            reason: `Not enough labeled samples (${samples.length}/${AI_MIN_TRAINING_SAMPLES}).`,
            sampleCount: samples.length,
        };
    }

    const dataset = samples
        .map((sample: any) => {
            const rawFeatures = sample.aiFeatures instanceof Map
                ? Object.fromEntries(sample.aiFeatures)
                : sample.aiFeatures || {};

            const x = featuresToVector(rawFeatures);
            const y = sample.status === 'Completed' ? 1 : 0;

            return { x, y };
        })
        .filter((item) => item.x.length === AI_FEATURE_NAMES.length);

    if (dataset.length < AI_MIN_TRAINING_SAMPLES) {
        return {
            trained: false,
            reason: `Not enough usable samples (${dataset.length}/${AI_MIN_TRAINING_SAMPLES}).`,
            sampleCount: dataset.length,
        };
    }

    let weights = new Array<number>(AI_FEATURE_NAMES.length).fill(0);
    let bias = 0;

    const learningRate = 0.08;
    const epochs = 250;
    const l2 = 0.0005;

    for (let epoch = 0; epoch < epochs; epoch += 1) {
        for (const row of dataset) {
            const z = dotProduct(weights, row.x) + bias;
            const prediction = sigmoid(z);
            const error = prediction - row.y;

            for (let i = 0; i < weights.length; i += 1) {
                weights[i] -= learningRate * (error * row.x[i] + l2 * weights[i]);
            }

            bias -= learningRate * error;
        }
    }

    let correct = 0;
    for (const row of dataset) {
        const probability = sigmoid(dotProduct(weights, row.x) + bias);
        const predictedLabel = probability >= 0.5 ? 1 : 0;
        if (predictedLabel === row.y) correct += 1;
    }

    const accuracy = dataset.length > 0 ? correct / dataset.length : 0;

    const modelDoc = await AIRecommendationModel.findOneAndUpdate(
        { modelKey: AI_MODEL_KEY },
        {
            $set: {
                version: AI_MODEL_VERSION,
                weights,
                bias,
                featureNames: [...AI_FEATURE_NAMES],
                trainingSamples: dataset.length,
                accuracy,
                lastTrainedAt: new Date(),
            },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return {
        trained: true,
        sampleCount: dataset.length,
        accuracy,
        model: modelDoc,
    };
};

const getActiveRecommendationModel = async () => {
    const model = await AIRecommendationModel.findOne({ modelKey: AI_MODEL_KEY }).lean();
    const modelAge = model?.lastTrainedAt
        ? Date.now() - new Date(model.lastTrainedAt).getTime()
        : Number.POSITIVE_INFINITY;

    if (!model || modelAge > AI_MODEL_MAX_AGE_MS) {
        await trainRecommendationModelInternal(false);
        return AIRecommendationModel.findOne({ modelKey: AI_MODEL_KEY }).lean();
    }

    return model;
};

async function generateRecommendationsForStudent(studentId: string, force: boolean) {
    const existing = await Recommendation.find({ userId: studentId });
    if (!force && existing.length > 0) {
        return { created: 0, updated: 0, total: existing.length };
    }

    const [user, goalsRaw, studentSkills, formations, competences] = await Promise.all([
        Student.findById(studentId).select('filiereId bio niveau promotion expectedGraduation'),
        Goal.find({ studentId }).select('relatedCompetences title description type targetJobTitle status deadline priority'),
        StudentCompetence.find({ studentId }).populate('competenceId'),
        Formation.find(),
        Competence.find().select('_id code name domain popularityScore'),
    ]);

    const goals = goalsRaw.filter((goal: any) => {
        const status = String(goal.status || '').toLowerCase();
        return !status.includes('completed') && !status.includes('done');
    });

    const filiereId = (user as { filiereId?: string } | null)?.filiereId;
    const filiere = filiereId ? await Filiere.findById(filiereId).select('titre description') : null;

    const codeToId = new Map(
        competences
            .filter((c: any) => c.code)
            .map((c: any) => [c.code.toString(), c._id.toString()])
    );

    const idToName = new Map(
        competences.map((c: any) => [c._id.toString(), c.name || c.code || c._id.toString()])
    );

    const studentProfile = user as {
        filiereId?: string;
        bio?: string;
        niveau?: string;
        promotion?: number;
        expectedGraduation?: Date | string;
    } | null;

    const profileKeywordSet = new Set<string>();
    const keywordSet = new Set<string>();

    const addTokens = (target: Set<string>, value?: string) => {
        normalizeTokens(value || '').forEach((token) => {
            if (!stopwords.has(token) && token.length > 2) target.add(token);
        });
    };

    goals.forEach((goal: any) => {
        addTokens(keywordSet, goal.title || '');
        addTokens(keywordSet, goal.description || '');
        addTokens(keywordSet, goal.targetJobTitle || '');

        addTokens(profileKeywordSet, goal.title || '');
        addTokens(profileKeywordSet, goal.description || '');
        addTokens(profileKeywordSet, goal.targetJobTitle || '');
    });

    studentSkills.forEach((skill: any) => {
        const name = skill.competenceId?.name || '';
        addTokens(keywordSet, name);
    });

    if (filiere?.titre) {
        addTokens(keywordSet, filiere.titre);
        addTokens(profileKeywordSet, filiere.titre);
    }

    if ((filiere as any)?.description) {
        addTokens(keywordSet, (filiere as any).description);
        addTokens(profileKeywordSet, (filiere as any).description);
    }

    addTokens(keywordSet, studentProfile?.bio || '');
    addTokens(keywordSet, studentProfile?.niveau || '');
    addTokens(profileKeywordSet, studentProfile?.bio || '');
    addTokens(profileKeywordSet, studentProfile?.niveau || '');

    const studentLevelRank = toLevelRank(studentProfile?.niveau || null);
    const expectedGraduationDate = studentProfile?.expectedGraduation
        ? new Date(studentProfile.expectedGraduation)
        : null;

    const goalPlans = goals.map((goal: any) => {
        const goalSkillIds = new Set<string>(
            (goal.relatedCompetences || []).map((id: any) => id.toString())
        );

        if (goalSkillIds.size === 0) {
            const goalTokens = normalizeTokens(`${goal.title || ''} ${goal.description || ''} ${goal.targetJobTitle || ''}`)
                .filter((token) => token.length > 2 && !stopwords.has(token));

            if (goalTokens.length > 0) {
                const matchedSkills = competences
                    .filter((c: any) => {
                        const name = (c.name || '').toLowerCase();
                        const domain = (c.domain || '').toLowerCase();
                        return goalTokens.some((token) => name.includes(token) || domain.includes(token));
                    })
                    .sort((a: any, b: any) => (b.popularityScore || 0) - (a.popularityScore || 0))
                    .slice(0, 10);

                matchedSkills.forEach((skill: any) => goalSkillIds.add(skill._id.toString()));
            }
        }

        const deadlineDate = goal.deadline ? new Date(goal.deadline) : null;
        const monthsToDeadline = deadlineDate && !Number.isNaN(deadlineDate.getTime())
            ? Math.max(0, Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))
            : null;

        return {
            goalId: goal._id.toString(),
            title: goal.title || 'Objectif',
            deadline: goal.deadline,
            monthsToDeadline,
            skillIds: goalSkillIds,
        };
    }).filter((goalPlan) => goalPlan.skillIds.size > 0);

    const goalCompetenceIds = new Set<string>(
        goalPlans.flatMap((goalPlan) => [...goalPlan.skillIds])
    );

    if (goalCompetenceIds.size === 0 && filiere?.titre) {
        const filiereTokens = new Set(
            normalizeTokens(filiere.titre).filter((token) => token.length > 2)
        );
        const fallbackSkills = competences
            .filter((c: any) => {
                const name = (c.name || '').toLowerCase();
                const domain = (c.domain || '').toLowerCase();
                return [...filiereTokens].some((token) => name.includes(token) || domain.includes(token));
            })
            .sort((a: any, b: any) => (b.popularityScore || 0) - (a.popularityScore || 0))
            .slice(0, 12);

        fallbackSkills.forEach((skill: any) => goalCompetenceIds.add(skill._id.toString()));
    }

    const progressMap = new Map<string, number>();
    studentSkills.forEach((skill: any) => {
        const id = skill.competenceId?._id?.toString();
        if (!id) return;
        const value = skill.progressPercentage ?? skill.confidenceScore ?? 0;
        const clamped = Math.min(100, Math.max(0, value));
        progressMap.set(id, clamped);
    });

    const missingSkillIds = new Set<string>(
        [...goalCompetenceIds].filter((id) => !progressMap.has(id) || (progressMap.get(id) || 0) < 60)
    );

    const goalMissingPlans = goalPlans
        .map((goalPlan) => {
            const missingIds = [...goalPlan.skillIds].filter(
                (id) => !progressMap.has(id) || (progressMap.get(id) || 0) < 60
            );

            return {
                ...goalPlan,
                missingIds,
            };
        })
        .filter((goalPlan) => goalPlan.missingIds.length > 0);

    const existingMap = new Map<string, any>();
    existing.forEach((rec: any) => {
        const key = `${rec.sourceType || 'Formation'}:${rec.sourceId || rec.title}:${rec.type}`;
        existingMap.set(key, rec);
    });

    const aiModel = await getActiveRecommendationModel();

    const scored = formations
        .map((formation: any) => {
            const mappedType = mapFormationType(formation.type);
            if (!['Course', 'Certification', 'Book'].includes(mappedType)) {
                return null;
            }

            const covered = (formation.coveredCompetences || []).map((item: any) => {
                if (!item) return null;
                const value = item.toString();
                if (codeToId.has(value)) return codeToId.get(value);
                return value;
            }).filter(Boolean) as string[];

            const coveredIds = new Set(covered);

            const goalMatches = goalMissingPlans
                .map((goalPlan) => {
                    const coveredMissingIds = goalPlan.missingIds.filter((id) => coveredIds.has(id));
                    const coveredMissingCount = coveredMissingIds.length;
                    const coverageRatio = goalPlan.missingIds.length > 0
                        ? coveredMissingCount / goalPlan.missingIds.length
                        : 0;
                    const urgencyBoost = goalPlan.monthsToDeadline !== null
                        ? goalPlan.monthsToDeadline <= 3
                            ? 2
                            : goalPlan.monthsToDeadline <= 6
                                ? 1
                                : 0
                        : 0;

                    const objectiveScore = coveredMissingCount * 2 + coverageRatio * 3 + urgencyBoost;

                    return {
                        goalId: goalPlan.goalId,
                        goalTitle: goalPlan.title,
                        coveredMissingIds,
                        coveredMissingCount,
                        coverageRatio,
                        urgencyBoost,
                        objectiveScore,
                    };
                })
                .filter((goalMatch) => goalMatch.coveredMissingCount > 0)
                .sort((a, b) => b.objectiveScore - a.objectiveScore);

            const bestGoalMatch = goalMatches[0] || null;
            const hasGoalMatch = Boolean(bestGoalMatch);

            if (goalMissingPlans.length > 0 && !hasGoalMatch) {
                // If user has explicit active objective gaps, keep only formations that help at least one gap.
                return null;
            }

            const missingCovered = hasGoalMatch
                ? bestGoalMatch!.coveredMissingIds
                : [...coveredIds].filter((id) => missingSkillIds.has(id));
            const missingCount = missingCovered.length;

            const formationText = `${formation.title || ''} ${formation.description || ''}`.toLowerCase();
            const keywordHits = [...keywordSet].filter((token) => formationText.includes(token)).length;
            const profileHits = [...profileKeywordSet].filter((token) => formationText.includes(token)).length;

            const formationLevelRank = toLevelRank(formation.level || null);
            let levelScore = 0;
            if (studentLevelRank !== null && formationLevelRank !== null) {
                const diff = Math.abs(studentLevelRank - formationLevelRank);
                if (diff === 0) levelScore = 2;
                else if (diff === 1) levelScore = 1;
                else if (formationLevelRank - studentLevelRank >= 2) levelScore = -1;
            }

            let timelineScore = 0;
            if (expectedGraduationDate && !Number.isNaN(expectedGraduationDate.getTime())) {
                const monthsToGraduation = Math.max(
                    0,
                    Math.ceil((expectedGraduationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
                );
                const durationHours = Number(formation.duration || 0);

                if (monthsToGraduation <= 6 && durationHours > 0) {
                    if (durationHours <= 20) timelineScore = 1;
                    else if (durationHours >= 60) timelineScore = -1;
                }
            }

            if (missingCount === 0 && !hasGoalMatch && keywordHits === 0 && profileHits === 0 && levelScore <= 0) {
                return null;
            }

            let score = 0;
            if (hasGoalMatch && bestGoalMatch) {
                score += 4;
                score += Math.min(8, bestGoalMatch.coveredMissingCount * 2);
                score += Math.min(3, Math.round(bestGoalMatch.coverageRatio * 4));
                score += bestGoalMatch.urgencyBoost;
            } else if (missingCount > 0) {
                score += Math.min(4, missingCount);
            }
            if (keywordHits > 0) score += Math.min(3, keywordHits);
            if (profileHits > 0) score += Math.min(3, profileHits);
            score += levelScore;
            score += timelineScore;

            const aiFeatures = toAIFeatures({
                hasGoalMatch,
                missingCount,
                keywordHits,
                profileHits,
                levelScore,
                timelineScore,
            });
            const aiProbability = predictRecommendationProbability(aiModel, aiFeatures);
            score += (aiProbability - 0.5) * 3;

            const missingSkills = missingCovered
                .slice(0, 3)
                .map((id) => idToName.get(id) || id)
                .filter(Boolean);

            const reasonParts: string[] = [];
            if (hasGoalMatch && bestGoalMatch && missingSkills.length) {
                reasonParts.push(`Pour atteindre l'objectif "${bestGoalMatch.goalTitle}", suivez cette formation pour couvrir: ${missingSkills.join(', ')}.`);
            } else if (hasGoalMatch && bestGoalMatch) {
                reasonParts.push(`Cette formation est alignee avec votre objectif "${bestGoalMatch.goalTitle}".`);
            } else if (missingSkills.length) {
                reasonParts.push(`Targets skills you are building: ${missingSkills.join(', ')}.`);
            }

            if (profileHits > 0) {
                reasonParts.push('Aligned with your profile information and interests.');
            }

            if (levelScore > 0 && studentProfile?.niveau) {
                reasonParts.push(`Fits your current level (${studentProfile.niveau}).`);
            }

            if (timelineScore > 0) {
                reasonParts.push('Fits your current timeline.');
            }

            if (aiProbability >= 0.8) {
                reasonParts.push('AI model predicts high relevance for your profile.');
            } else if (aiProbability >= 0.65) {
                reasonParts.push('AI model predicts good relevance for your profile.');
            }

            if (reasonParts.length === 0) {
                reasonParts.push('Recommended to broaden your learning path.');
            }

            const reason = reasonParts.join(' ');

            return {
                formation,
                mappedType,
                score,
                reason,
                hasGoalMatch,
                missingCount,
                profileHits,
                aiFeatures,
                aiProbability,
            };
        })
        .filter(Boolean) as any[];

    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const ratingA = a.formation.averageRating || 0;
        const ratingB = b.formation.averageRating || 0;
        return ratingB - ratingA;
    });

    const recommendations = scored.slice(0, 24).map((item) => {
        const formation = item.formation;
        const type = item.mappedType as 'Course' | 'Certification' | 'Book';
        let priority = computePriority(item.hasGoalMatch, item.missingCount, item.profileHits || 0);

        if (item.aiProbability >= 0.82) {
            priority = 'High';
        } else if (item.aiProbability >= 0.65 && priority === 'Low') {
            priority = 'Medium';
        }

        return {
            userId: studentId,
            type,
            title: formation.title,
            description: formation.description,
            link: formation.link,
            priority,
            estimatedHours: formation.duration || 6,
            reason: item.reason,
            status: 'Active',
            isCompleted: false,
            progressPercent: 0,
            sourceId: formation._id,
            sourceType: 'Formation',
            aiFeatures: item.aiFeatures,
            aiProbability: item.aiProbability,
        };
    });

    const operations: any[] = [];
    let created = 0;
    let updated = 0;

    recommendations.forEach((rec) => {
        const key = `${rec.sourceType || 'Formation'}:${rec.sourceId || rec.title}:${rec.type}`;
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
                            aiFeatures: rec.aiFeatures,
                            aiProbability: rec.aiProbability,
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

    if (operations.length > 0) {
        await Recommendation.bulkWrite(operations, { ordered: false });
    }

    return { created, updated, total: recommendations.length };
}

const awardRecommendationXp = async (studentId: string, estimatedHours?: number) => {
    const xpAward = Math.max(10, Math.min(50, Math.round((estimatedHours || 5) * 2)));
    const now = new Date();

    const profile = await ActivityProfile.findOneAndUpdate(
        { studentId },
        {
            $inc: { experiencePoints: xpAward, bonusExperiencePoints: xpAward, totalActivities: 1 },
            $set: { lastActivityDate: now },
            $push: { activityHistory: { date: now, activity: 'Recommendation Completed', pointsEarned: xpAward } },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const nextLevel = Math.floor((profile?.experiencePoints || 0) / 100) + 1;
    if (profile && profile.level !== nextLevel) {
        profile.level = nextLevel;
        await profile.save();
    }

    return xpAward;
};

/**
 * Train AI Recommendation Model
 */
export const trainRecommendationModel = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId as string;
        if (!studentId) {
            res.status(401).json({ error: 'Unauthorized', statusCode: 401 });
            return;
        }

        const result = await trainRecommendationModelInternal(true);

        res.status(200).json({
            success: true,
            data: result,
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to train AI recommendation model',
            statusCode: 500,
        });
    }
};

/**
 * Generate Recommendations
 */
export const generateRecommendations = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId as string;
        if (!studentId) {
            res.status(401).json({ error: 'Unauthorized', statusCode: 401 });
            return;
        }
        const result = await generateRecommendationsForStudent(studentId, true);

        res.status(200).json({
            success: true,
            data: result,
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to generate recommendations',
            statusCode: 500,
        });
    }
};

/**
 * Complete Recommendation
 */
export const completeRecommendation = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId as string;
        if (!studentId) {
            res.status(401).json({ error: 'Unauthorized', statusCode: 401 });
            return;
        }
        const { id } = req.params;

        const recommendation = await Recommendation.findOne({ _id: id, userId: studentId });
        if (!recommendation) {
            res.status(404).json({ error: 'Recommendation not found', statusCode: 404 });
            return;
        }

        const updated = await Recommendation.findOneAndUpdate(
            { _id: id, userId: studentId },
            { $set: { status: 'Completed', isCompleted: true, progressPercent: 100 } },
            { new: true }
        );

        const xpAward = await awardRecommendationXp(studentId, recommendation.estimatedHours);

        // Use explicit feedback to incrementally improve the AI model.
        await trainRecommendationModelInternal(false);

        res.status(200).json({
            success: true,
            data: { recommendation: updated, xpAward },
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to complete recommendation',
            statusCode: 500,
        });
    }
};

/**
 * Ignore Recommendation
 */
export const ignoreRecommendation = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId as string;
        if (!studentId) {
            res.status(401).json({ error: 'Unauthorized', statusCode: 401 });
            return;
        }
        const { id } = req.params;

        const updated = await Recommendation.findOneAndUpdate(
            { _id: id, userId: studentId },
            { $set: { status: 'Ignored', isCompleted: false } },
            { new: true }
        );

        if (!updated) {
            res.status(404).json({ error: 'Recommendation not found', statusCode: 404 });
            return;
        }

        // Ignored items are negative labels for the recommendation model.
        await trainRecommendationModelInternal(false);

        res.status(200).json({
            success: true,
            data: updated,
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to ignore recommendation',
            statusCode: 500,
        });
    }
};

/**
 * Get Recommendations
 */
export const getRecommendations = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId as string;
        if (!studentId) {
            res.status(401).json({ error: 'Unauthorized', statusCode: 401 });
            return;
        }
        await generateRecommendationsForStudent(studentId, false);

        const { page = 1, limit = 9, type, priority, status, sort = 'priority' } = req.query;
        const pageNumber = Number(page) || 1;
        const limitNumber = Number(limit) || 9;

        const match: any = { userId: studentId };
        if (status) match.status = status;
        if (type) match.type = type;
        if (priority) match.priority = priority;

        const total = await Recommendation.countDocuments(match);
        const skip = (pageNumber - 1) * limitNumber;

        let recommendations: any[] = [];
        if (sort === 'priority') {
            recommendations = await Recommendation.aggregate([
                { $match: match },
                {
                    $addFields: {
                        priorityRank: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ['$priority', 'High'] }, then: 1 },
                                    { case: { $eq: ['$priority', 'Medium'] }, then: 2 },
                                    { case: { $eq: ['$priority', 'Low'] }, then: 3 },
                                ],
                                default: 3,
                            },
                        },
                    },
                },
                { $sort: { priorityRank: 1, estimatedHours: 1, createdAt: -1 } },
                { $skip: skip },
                { $limit: limitNumber },
            ]);
        } else if (sort === 'duration') {
            recommendations = await Recommendation.find(match)
                .sort({ estimatedHours: 1, createdAt: -1 })
                .skip(skip)
                .limit(limitNumber);
        } else {
            recommendations = await Recommendation.find(match)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber);
        }

        res.status(200).json({
            success: true,
            data: {
                recommendations,
                pagination: {
                    total,
                    page: pageNumber,
                    limit: limitNumber,
                    pages: Math.ceil(total / limitNumber),
                },
                filters: { type, priority, status, sort },
            },
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch recommendations',
            statusCode: 500,
        });
    }
};
