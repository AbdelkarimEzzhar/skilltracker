import { Request, Response } from 'express';
import { User, Competence, Goal, Formation, Achievement, Filiere, StudentCompetence } from '../models';

/**
 * Admin Stats
 * Returns real-time platform statistics
 */
export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const [
            totalUsers,
            totalAdmins,
            totalStudents,
            totalCompetences,
            totalGoals,
            totalFormations,
            totalAchievements,
            totalSpecialties,
            totalStudentSkills,
            activeStudents,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'ADMIN' }),
            User.countDocuments({ role: 'STUDENT' }),
            Competence.countDocuments(),
            Goal.countDocuments(),
            Formation.countDocuments(),
            Achievement.countDocuments(),
            Filiere.countDocuments(),
            StudentCompetence.countDocuments(),
            User.countDocuments({ role: 'STUDENT', status: 'active' }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalAdmins,
                totalStudents,
                activeStudents,
                totalCompetences,
                totalGoals,
                totalFormations,
                totalAchievements,
                totalSpecialties,
                totalStudentSkills,
            },
            statusCode: 200,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch admin stats',
            statusCode: 500,
        });
    }
};
