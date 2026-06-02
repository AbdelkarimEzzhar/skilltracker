import { Router } from 'express';
import {
    getRecommendations,
    generateRecommendations,
    trainRecommendationModel,
    startRecommendation,
    completeRecommendation,
    ignoreRecommendation,
} from '../controllers/students';

const router = Router();

router.get('/', getRecommendations);
router.post('/generate', generateRecommendations);
router.post('/train', trainRecommendationModel);
router.post('/:id/start', startRecommendation);
router.post('/:id/complete', completeRecommendation);
router.post('/:id/ignore', ignoreRecommendation);

export default router;
