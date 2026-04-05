import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

/**
 * JWT Payload Interface
 * Contains minimal user info for token payload
 */
export interface JWTPayload {
    userId: string;
    email: string;
    role: 'ADMIN' | 'STUDENT';
    iat?: number;
    exp?: number;
}

/**
 * Generate JWT Token
 * Stored in HttpOnly cookie for security (prevents XSS)
 */
export const generateToken = (user: IUser): string => {
    const normalizedRole = user.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STUDENT';
    const payload: JWTPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: normalizedRole,
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'your_super_secret_key', {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

/**
 * Verify JWT Token
 * Returns decoded payload or throws error
 */
export const verifyToken = (token: string): JWTPayload => {
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_key') as JWTPayload;
        const normalizedRole = payload.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STUDENT';
        return { ...payload, role: normalizedRole };
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

/**
 * Decode Token Without Verification
 * Useful for debugging
 */
export const decodeToken = (token: string): JWTPayload | null => {
    try {
        return jwt.decode(token) as JWTPayload | null;
    } catch {
        return null;
    }
};
