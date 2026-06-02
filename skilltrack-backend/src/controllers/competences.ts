import { Request, Response } from 'express';
import { Competence } from '../models/Competence';
import { ActivityProfile, StudentCompetence } from '../models';
import { generateRecommendationsForStudent } from '../services/recommendationEngine';

/**
 * Create Competence (Admin)
 */
export const createCompetence = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code, name, description, domain, category, level, difficulty, tags } = req.body;

        if (!code || !name || !description || !domain || !category) {
            res.status(400).json({
                error: 'Required fields: code, name, description, domain, category',
                statusCode: 400,
            });
            return;
        }

        const competence = await Competence.create({
            code: code.toUpperCase(),
            name,
            description,
            domain,
            category,
            level: level || 'Beginner',
            difficulty: difficulty || 5,
            tags: tags || [],
        });

        res.status(201).json({
            success: true,
            data: competence,
            statusCode: 201,
        });
    } catch (error: any) {
        if (error.code === 11000) {
            res.status(409).json({
                error: 'Skill code already exists',
                statusCode: 409,
            });
            return;
        }
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to create competence',
            statusCode: 500,
        });
    }
};

/**
 * Get All Competences
 */
export const getAllCompetences = async (req: Request, res: Response): Promise<void> => {
    try {
        const { domain, category, level, search, page = 1, limit = 10 } = req.query;

        const pageNumber = Number(page) || 1;
        const limitNumber = Number(limit) || 10;

        const filter: any = {};
        if (domain) filter.domain = domain;
        if (category) filter.category = category;
        if (level) filter.level = level;

        let query = Competence.find(filter);

        if (search) {
            const pattern = new RegExp(search.toString(), 'i');
            query = Competence.find({
                ...filter,
                $or: [
                    { name: pattern },
                    { description: pattern },
                    { domain: pattern },
                    { category: pattern },
                    { code: pattern },
                ],
            });
        }

        const skip = (pageNumber - 1) * limitNumber;
        const competences = await query.skip(skip).limit(limitNumber);
        const total = await Competence.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                competences,
                pagination: { total, page: pageNumber, limit: limitNumber, pages: Math.ceil(total / limitNumber) },
            },
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch competences',
            statusCode: 500,
        });
    }
};

/**
 * Get Competence by ID
 */
export const getCompetenceById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const competence = await Competence.findById(id);

        if (!competence) {
            res.status(404).json({ error: 'Competence not found', statusCode: 404 });
            return;
        }

        res.status(200).json({
            success: true,
            data: competence,
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch competence',
            statusCode: 500,
        });
    }
};

/**
 * Update Competence (Admin)
 */
export const updateCompetence = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, description, domain, category, level, difficulty, tags, popularityScore, estimatedDuration } = req.body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (domain) updateData.domain = domain;
        if (category) updateData.category = category;
        if (level) updateData.level = level;
        if (difficulty !== undefined) updateData.difficulty = difficulty;
        if (estimatedDuration !== undefined) updateData.estimatedDuration = estimatedDuration;
        if (tags) updateData.tags = tags;
        if (popularityScore !== undefined) updateData.popularityScore = popularityScore;

        const competence = await Competence.findByIdAndUpdate(id, updateData, { new: true });

        if (!competence) {
            res.status(404).json({ error: 'Competence not found', statusCode: 404 });
            return;
        }

        res.status(200).json({
            success: true,
            data: competence,
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to update competence',
            statusCode: 500,
        });
    }
};

/**
 * Delete Competence (Admin)
 */
export const deleteCompetence = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const competence = await Competence.findByIdAndDelete(id);

        if (!competence) {
            res.status(404).json({ error: 'Competence not found', statusCode: 404 });
            return;
        }

        const impactedStudentIds = await StudentCompetence.distinct('studentId', { competenceId: id });
        if (impactedStudentIds.length) {
            await StudentCompetence.deleteMany({ competenceId: id });

            for (const studentId of impactedStudentIds) {
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

                await generateRecommendationsForStudent(studentId.toString(), true);
            }
        }

        res.status(200).json({
            success: true,
            data: { message: 'Competence deleted successfully' },
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to delete competence',
            statusCode: 500,
        });
    }
};

/**
 * Get Competencies Stats (Admin)
 */
export const getCompetenciesStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const totalCompetences = await Competence.countDocuments();
        const byCategory = await Competence.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                },
            },
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalCompetences,
                byCategory,
            },
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch stats',
            statusCode: 500,
        });
    }
};
