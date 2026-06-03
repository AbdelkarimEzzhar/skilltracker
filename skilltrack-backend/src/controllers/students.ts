import { Request, Response } from 'express';
import mongoose from 'mongoose';
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
import {
    generateRecommendationsForStudent as engineGenerateRecommendationsForStudent,
    bumpSkillsFromRecommendation,
    resolveGoalSkills,
} from '../services/recommendationEngine';

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
 * Delete Student Skill
 */
export const deleteStudentSkill = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId as string;
        if (!studentId) {
            res.status(401).json({ error: 'Unauthorized', statusCode: 401 });
            return;
        }

        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Skill ID is required', statusCode: 400 });
            return;
        }

        const deletedSkill = await StudentCompetence.findOneAndDelete({ _id: id, studentId });

        if (!deletedSkill) {
            res.status(404).json({ error: 'Skill not found', statusCode: 404 });
            return;
        }

        const allSkills = await StudentCompetence.find({ studentId }).select('progressPercentage confidenceScore');
        const totalProgress = allSkills.reduce((sum, skill) => {
            const value = skill.progressPercentage ?? skill.confidenceScore ?? 0;
            const clamped = Math.min(100, Math.max(0, value));
            return sum + clamped;
        }, 0);

        const existingProfile = await ActivityProfile.findOne({ studentId });
        const bonusXp = existingProfile?.bonusExperiencePoints || 0;
        const totalXp = totalProgress + bonusXp;
        const now = new Date();

        const profile = await ActivityProfile.findOneAndUpdate(
            { studentId },
            { $set: { experiencePoints: totalXp, lastActivityDate: now } },
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
            data: { message: 'Skill deleted successfully' },
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to delete skill',
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

        const needsInference = goals.some((goal: any) => !goal.relatedCompetences || goal.relatedCompetences.length === 0);
        const competences = needsInference
            ? await Competence.find().select('_id code name domain popularityScore').lean()
            : [];
        const competenceById = new Map<string, any>();
        const codeToId = new Map<string, string>();

        if (needsInference) {
            competences.forEach((competence: any) => {
                if (competence._id) competenceById.set(competence._id.toString(), competence);
                if (competence.code) codeToId.set(String(competence.code).toUpperCase(), competence._id.toString());
            });
        }

        const roadmap = goals.map((goal, index) => {
            const relatedCompetences = Array.isArray(goal.relatedCompetences) ? goal.relatedCompetences : [];
            const relatedIds = relatedCompetences
                .map((item: any) => (item?._id || item)?.toString())
                .filter(Boolean) as string[];

            const inferredIds = !relatedIds.length && needsInference
                ? resolveGoalSkills(goal, competences, codeToId)
                : [];

            const skillIds = relatedIds.length ? relatedIds : inferredIds;

            const requiredSkills = skillIds
                .filter((id) => !masteredSkillIds.includes(id))
                .map((id) => {
                    const related = relatedCompetences.find((item: any) => item?._id?.toString() === id || item?.toString() === id);
                    const source = related && typeof related === 'object' ? related : competenceById.get(id);
                    if (!source) return null;
                    return { name: source.name || source.code || 'Skill', priority: goal.priority || 'Medium' };
                })
                .filter(Boolean) as Array<{ name: string; priority: string | number }>;

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
    return engineGenerateRecommendationsForStudent(studentId, force);
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

const attachTargetCompetences = async (recommendations: any[]) => {
    const targetIds = new Set<string>();
    recommendations.forEach((rec) => {
        (rec.targetCompetenceIds || []).forEach((id: any) => {
            if (id) targetIds.add(id.toString());
        });
    });

    if (!targetIds.size) return recommendations;

    const competences = await Competence.find({ _id: { $in: [...targetIds] } })
        .select('_id name domain')
        .lean();
    const competenceById = new Map<string, any>();
    competences.forEach((comp) => competenceById.set(comp._id.toString(), comp));

    return recommendations.map((rec) => ({
        ...rec,
        targetCompetences: (rec.targetCompetenceIds || [])
            .map((id: any) => competenceById.get(id.toString()))
            .filter(Boolean),
    }));
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
 * Start Recommendation
 */
export const startRecommendation = async (req: Request & AuthRequest, res: Response): Promise<void> => {
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

        const progress = Math.max(0, Math.min(100, Number(recommendation.progressPercent || 0)));
        const nextProgress = progress >= 90 ? progress : Math.max(10, progress + 10);

        const updated = await Recommendation.findOneAndUpdate(
            { _id: id, userId: studentId },
            { $set: { status: 'Active', isCompleted: false, progressPercent: nextProgress } },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: updated,
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to start recommendation',
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
        await bumpSkillsFromRecommendation(studentId, updated || recommendation);

        // Use explicit feedback to incrementally improve the AI model.
        await trainRecommendationModelInternal(false);
        await generateRecommendationsForStudent(studentId, true);

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
        await generateRecommendationsForStudent(studentId, true);

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
        const existingCount = await Recommendation.countDocuments({ userId: studentId });
        if (existingCount === 0) {
            await generateRecommendationsForStudent(studentId, true);
        }

        const { page = 1, limit = 9, type, priority, status, sort = 'priority' } = req.query;
        const pageNumber = Number(page) || 1;
        const limitNumber = Number(limit) || 9;

        const userObjectId = mongoose.Types.ObjectId.isValid(studentId)
            ? new mongoose.Types.ObjectId(studentId)
            : studentId;
        const match: any = { userId: userObjectId };
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
                .limit(limitNumber)
                .lean();
        } else {
            recommendations = await Recommendation.find(match)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber)
                .lean();
        }

        recommendations = await attachTargetCompetences(recommendations);

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
