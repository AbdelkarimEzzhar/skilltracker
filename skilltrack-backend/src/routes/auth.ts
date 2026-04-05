import { Router } from 'express';
import { login, register, logout, getCurrentUser } from '../controllers/auth';
import { authMiddleware, adminOnly } from '../middleware/auth';

const router = Router();

/**
 * Public Routes
 */
router.post('/login', login);

/**
 * Admin Only Routes
 */
router.post('/register', authMiddleware, adminOnly, register);

/**
 * Protected Routes
 */
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getCurrentUser);

export default router;
