import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser, getStudentsStats } from '../controllers/users';
import { authMiddleware, adminOnly } from '../middleware/auth';

const router = Router();

/**
 * All routes require authentication and admin role
 */
router.use(authMiddleware, adminOnly);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.get('/stats/students', getStudentsStats);

export default router;
