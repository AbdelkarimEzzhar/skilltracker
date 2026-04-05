import { Router } from 'express';
import {
    createCompetence,
    getAllCompetences,
    getCompetenceById,
    updateCompetence,
    deleteCompetence,
    getCompetenciesStats,
} from '../controllers/competences';
import { authMiddleware, adminOnly } from '../middleware/auth';

const router = Router();

/**
 * Public routes
 */
router.get('/', getAllCompetences);
router.get('/:id', getCompetenceById);

/**
 * Admin only routes
 */
router.post('/', authMiddleware, adminOnly, createCompetence);
router.put('/:id', authMiddleware, adminOnly, updateCompetence);
router.delete('/:id', authMiddleware, adminOnly, deleteCompetence);
router.get('/stats/competences', authMiddleware, adminOnly, getCompetenciesStats);

export default router;
