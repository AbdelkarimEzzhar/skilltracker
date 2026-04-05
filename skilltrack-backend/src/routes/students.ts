import { Router } from 'express';
import {
    getStudentDashboard,
    getStudentSkills,
    updateStudentSkill,
    getStudentGoals,
    createStudentGoal,
    updateStudentGoal,
    deleteStudentGoal,
    getStudentProfile,
    updateStudentProfile,
    getCareerRoadmap,
    getRecommendations,
    generateRecommendations,
    trainRecommendationModel,
    completeRecommendation,
    ignoreRecommendation,
    getStudentAcademicRecords,
    addStudentAcademicCourse,
    getStudentAchievements,
} from '../controllers/students';
import { authMiddleware, studentOnly } from '../middleware/auth';

const router = Router();

/**
 * All routes require authentication and student role
 */
router.use(authMiddleware, studentOnly);

router.get('/dashboard', getStudentDashboard);
router.get('/profile', getStudentProfile);
router.put('/profile', updateStudentProfile);
router.get('/skills', getStudentSkills);
router.post('/skills', updateStudentSkill);
router.get('/academic-records', getStudentAcademicRecords);
router.post('/academic-records/courses', addStudentAcademicCourse);
router.get('/goals', getStudentGoals);
router.post('/goals', createStudentGoal);
router.put('/goals/:id', updateStudentGoal);
router.delete('/goals/:id', deleteStudentGoal);
router.get('/roadmap', getCareerRoadmap);
router.get('/recommendations', getRecommendations);
router.get('/achievements', getStudentAchievements);
router.post('/recommendations/generate', generateRecommendations);
router.post('/recommendations/train', trainRecommendationModel);
router.post('/recommendations/:id/complete', completeRecommendation);
router.post('/recommendations/:id/ignore', ignoreRecommendation);

export default router;
