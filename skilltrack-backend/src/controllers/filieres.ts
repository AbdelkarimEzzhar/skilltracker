import { Request, Response } from 'express';
import { Filiere } from '../models';

/**
 * Get All Filieres (Specialties)
 */
export const getAllFilieres = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, page = 1, limit = 50 } = req.query;

        const pageNumber = Number(page) || 1;
        const limitNumber = Number(limit) || 50;

        const filter: any = {};
        if (search) {
            filter.$text = { $search: search as string };
        }

        const skip = (pageNumber - 1) * limitNumber;
        const filieres = await Filiere.find(filter).skip(skip).limit(limitNumber);
        const total = await Filiere.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                filieres,
                pagination: { total, page: pageNumber, limit: limitNumber, pages: Math.ceil(total / limitNumber) },
            },
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch filieres',
            statusCode: 500,
        });
    }
};
