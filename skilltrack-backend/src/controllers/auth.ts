import { Request, Response } from 'express';
import { User, Student } from '../models/User';
import { ActivityProfile } from '../models/ActivityProfile';
import { generateToken } from '../utils/jwt';
import { LoginRequest, RegisterRequest, UserResponse, AuthRequest } from '../types';

/**
 * Login Controller
 * Authenticates user and returns JWT token
 */
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body as LoginRequest;

        // Validation
        if (!email || !password) {
            res.status(400).json({
                error: 'Email and password are required',
                statusCode: 400,
            });
            return;
        }

        // Find user and select password field
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            res.status(401).json({
                error: 'User not found',
                message: 'Invalid email or password',
            });
            return;
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            res.status(401).json({
                error: 'Invalid password',
                message: 'Invalid email or password',
            });
            return;
        }

        if (user.status !== 'active') {
            res.status(403).json({
                error: 'Account is inactive',
                statusCode: 403,
            });
            return;
        }

        // Generate JWT
        const token = generateToken(user);

        // Set HttpOnly cookie (more secure than localStorage)
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Prepare user response (without password)
        const loginRole = user.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STUDENT';
        const userResponse: UserResponse = {
            _id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            role: loginRole,
            status: user.status,
            filiereId: (user as any).filiereId?.toString(),
            niveau: (user as any).niveau,
            createdAt: user.createdAt,
        };

        res.status(200).json({
            success: true,
            data: {
                user: userResponse,
                token,
            },
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Login failed',
            statusCode: 500,
        });
    }
};

/**
 * Register Controller (Admin Only)
 * Creates new user account (student or admin)
 */
export const register = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        const { firstName, lastName, email, username, password, filiereId, specialtyId, niveau, role, status } = req.body as RegisterRequest;

        // Validation
        if (!firstName || !lastName || !email || !username || !password) {
            res.status(400).json({
                error: 'All fields are required',
                statusCode: 400,
            });
            return;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });

        if (existingUser) {
            res.status(409).json({
                error: 'Email or username already exists',
                statusCode: 409,
            });
            return;
        }

        const resolvedFiliereId = filiereId || specialtyId;
        const requestedRole = role?.toUpperCase() as 'ADMIN' | 'STUDENT' | undefined;

        // Determine if creating student or admin
        const isStudent = requestedRole ? requestedRole === 'STUDENT' : !!resolvedFiliereId;

        let user;
        if (isStudent) {
            user = new Student({
                firstName,
                lastName,
                email,
                username,
                password,
                role: 'STUDENT',
                status: status || 'active',
                filiereId: resolvedFiliereId,
                niveau: niveau || '1A',
                promotion: new Date().getFullYear(),
                expectedGraduation: new Date(new Date().getFullYear() + 3, 6, 15),
            });
        } else {
            user = new User({
                firstName,
                lastName,
                email,
                username,
                password,
                role: 'ADMIN',
                status: status || 'active',
            });
        }

        await user.save();

        // Create activity profile for students
        if (isStudent) {
            await ActivityProfile.create({
                studentId: user._id,
                level: 1,
                experiencePoints: 0,
                currentStreakDays: 0,
                longestStreakDays: 0,
                totalHours: 0,
                totalActivities: 0,
            });
        }

        const registerRole = user.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STUDENT';
        const userResponse: UserResponse = {
            _id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            role: registerRole,
            status: user.status,
            filiereId: (user as any).filiereId?.toString(),
            niveau: (user as any).niveau,
            createdAt: user.createdAt,
        };

        res.status(201).json({
            success: true,
            data: {
                user: userResponse,
            },
            statusCode: 201,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Registration failed',
            statusCode: 500,
        });
    }
};

/**
 * Logout Controller
 * Clears authentication cookie
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        res.clearCookie('authToken');
        res.status(200).json({
            success: true,
            data: { message: 'Logged out successfully' },
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Logout failed',
            statusCode: 500,
        });
    }
};

/**
 * Get Current User
 * Returns authenticated user's profile
 */
export const getCurrentUser = async (req: Request & AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated', statusCode: 401 });
            return;
        }

        const user = await User.findById(req.user.userId);

        if (!user) {
            res.status(404).json({ error: 'User not found', statusCode: 404 });
            return;
        }

        const currentRole = user.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STUDENT';
        const userResponse: UserResponse = {
            _id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            role: currentRole,
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
