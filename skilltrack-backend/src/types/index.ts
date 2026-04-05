/**
 * Extended Express Request with JWT Payload
 * Injected by authMiddleware
 */
export interface AuthRequest {
    user?: {
        userId: string;
        email: string;
        role: 'ADMIN' | 'STUDENT';
    };
}

/**
 * API Response Types
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    statusCode: number;
}

/**
 * Login Request Body
 */
export interface LoginRequest {
    email: string;
    password: string;
}

/**
 * Register Request Body
 */
export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    filiereId?: string; // For students
    specialtyId?: string; // Alias for filiereId
    niveau?: string;
    role?: 'ADMIN' | 'STUDENT';
    status?: 'active' | 'inactive';
}

/**
 * User Response (without password)
 */
export interface UserResponse {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    role: 'ADMIN' | 'STUDENT';
    status: 'active' | 'inactive';
    filiereId?: string;
    niveau?: string;
    createdAt: Date;
}
