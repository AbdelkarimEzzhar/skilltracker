import { Router } from 'express';
import { getAdminStats } from '../controllers/admin';
import { authMiddleware, adminOnly } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, adminOnly);
router.get('/stats', getAdminStats);

export default router;
