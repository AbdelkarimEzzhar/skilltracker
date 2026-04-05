import { Request, Response } from 'express';
import { User, Student } from '../models/User';
import { UserResponse, AuthRequest } from '../types';

/**
 * Get All Users (Admin)
 */
export const getAllUsers = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const { role, status, page = 1, limit = 10, search } = req.query;

        const pageNumber = Number(page) || 1;
        const limitNumber = Number(limit) || 10;

        const filter: any = {};
        if (role) filter.role = role.toString().toUpperCase();
        if (status) filter.status = status;
        if (search) {
            const pattern = new RegExp(search.toString(), 'i');
            filter.$or = [
                { firstName: pattern },
                { lastName: pattern },
                { email: pattern },
                { username: pattern },
            ];
        }

        const skip = (pageNumber - 1) * limitNumber;
        const users = await User.find(filter).skip(skip).limit(limitNumber).select('-password');
        const total = await User.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: { total, page: pageNumber, limit: limitNumber, pages: Math.ceil(total / limitNumber) },
            },
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch users',
            statusCode: 500,
        });
    }
};

/**
 * Get User by ID
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('-password');

        if (!user) {
            res.status(404).json({ error: 'User not found', statusCode: 404 });
            return;
        }

        const userResponse: UserResponse = {
            _id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            role: user.role,
            status: user.status,
            filiereId: (user as any).filiereId?.toString(),
            niveau: (user as any).niveau,
            createdAt: user.createdAt,
        };

        res.status(200).json({
            success: true,
            data: userResponse,
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch user',
            statusCode: 500,
        });
    }
};

/**
 * Update User (Admin)
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { firstName, lastName, status, role, filiereId, niveau, bio } = req.body;

        const updateData: any = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (status && ['active', 'inactive'].includes(status)) updateData.status = status;
        if (role && ['ADMIN', 'STUDENT', 'admin', 'student'].includes(role)) updateData.role = role;
        if (filiereId) updateData.filiereId = filiereId;
        if (niveau) updateData.niveau = niveau;
        if (bio !== undefined) updateData.bio = bio;

        const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');

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
            error: error instanceof Error ? error.message : 'Failed to update user',
            statusCode: 500,
        });
    }
};

/**
 * Delete User (Admin)
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            res.status(404).json({ error: 'User not found', statusCode: 404 });
            return;
        }

        res.status(200).json({
            success: true,
            data: { message: 'User deleted successfully' },
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to delete user',
            statusCode: 500,
        });
    }
};

/**
 * Get Students Stats (Admin)
 */
export const getStudentsStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const totalStudents = await User.countDocuments({ role: 'STUDENT' });
        const activeStudents = await User.countDocuments({ role: 'STUDENT', status: 'active' });
        const inactiveStudents = totalStudents - activeStudents;

        res.status(200).json({
            success: true,
            data: {
                totalStudents,
                activeStudents,
                inactiveStudents,
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
