import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/jwt';

/**
 * Authentication Middleware
 * Verifies JWT token from HttpOnly cookie
 * Injects user info into request.user
 */
export const authMiddleware = (req: Request & AuthRequest, res: Response, next: NextFunction): void => {
    try {
        const token = req.cookies?.authToken || req.headers.authorization?.split(' ')[1];

        if (!token) {
            res.status(401).json({ error: 'No authentication token provided', statusCode: 401 });
            return;
        }

        const payload = verifyToken(token);
        const normalizedRole = payload.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STUDENT';
        req.user = {
            userId: payload.userId,
            email: payload.email,
            role: normalizedRole,
        };

        next();
    } catch (error) {
        res.status(401).json({
            error: error instanceof Error ? error.message : 'Authentication failed',
            statusCode: 401,
        });
    }
};

/**
 * Role-Based Access Control Middleware
 * Restricts endpoints to specific roles
 */
export const roleMiddleware = (...allowedRoles: Array<'ADMIN' | 'STUDENT'>) => {
    return (req: Request & AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated', statusCode: 401 });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
                statusCode: 403,
            });
            return;
        }

        next();
    };
};

/**
 * Admin Only Middleware
 * Shorthand for roleMiddleware(['ADMIN'])
 */
export const adminOnly = (req: Request & AuthRequest, res: Response, next: NextFunction): void => {
    roleMiddleware('ADMIN')(req, res, next);
};

/**
 * Student Only Middleware
 * Shorthand for roleMiddleware(['STUDENT'])
 */
export const studentOnly = (req: Request & AuthRequest, res: Response, next: NextFunction): void => {
    roleMiddleware('STUDENT')(req, res, next);
};
