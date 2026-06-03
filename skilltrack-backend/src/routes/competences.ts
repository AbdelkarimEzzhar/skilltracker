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

/**
 * Admin only routes (static paths before /:id)
 */
router.get('/stats/competences', authMiddleware, adminOnly, getCompetenciesStats);
router.post('/', authMiddleware, adminOnly, createCompetence);
router.get('/:id', getCompetenceById);
router.put('/:id', authMiddleware, adminOnly, updateCompetence);
router.delete('/:id', authMiddleware, adminOnly, deleteCompetence);

export default router;
