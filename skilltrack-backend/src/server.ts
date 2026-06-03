import './config/env';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDatabase } from './config/database';
import { ensureAdminUser, seedFromBackupIfNeeded } from './utils/backup-seed';
import { seedResourcesIfNeeded } from './utils/auto-resources';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import competencesRoutes from './routes/competences';
import studentsRoutes from './routes/students';
import adminRoutes from './routes/admin';
import filieresRoutes from './routes/filieres';
import chatRoutes from './routes/chatRoutes';

/**
 * SkillTrack Backend Server
 * MERN Stack: MongoDB, Express, React/Next.js, Node.js
 * 
 * Security Notes:
 * - JWT tokens stored in HttpOnly cookies (XSS protection)
 * - CORS configured for specific origins
 * - Password hashed with bcryptjs
 */

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// CORS Configuration
// Security: Restrict to specific origins in production
const allowedOrigins = new Set(
    (process.env.CORS_ORIGIN || 'http://localhost:3000')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
);
const localOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) {
                callback(null, true);
                return;
            }

            if (allowedOrigins.has(origin)) {
                callback(null, true);
                return;
            }

            if (process.env.NODE_ENV !== 'production' && localOriginPattern.test(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error('Not allowed by CORS'));
        },
        credentials: true, // Allow credentials (cookies)
    })
);

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Welcome Endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to SkillTrack Backend API',
        version: '1.0.0',
        documentation: '/api/docs',
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/competences', competencesRoutes);
app.use('/api/skills', competencesRoutes);
app.use('/api/student', studentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/filieres', filieresRoutes);
app.use('/api/chat', chatRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method,
    });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    console.error(`[ERROR] ${message}`);

    res.status(statusCode).json({
        error: message,
        statusCode,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// Start Server
const startServer = async () => {
    try {
        await connectDatabase();

        try {
            const adminResult = await ensureAdminUser();
            if (adminResult.created) {
                console.log(`Default admin created (${adminResult.email}). Change the password after first login.`);
            }
        } catch (adminError) {
            console.warn(
                'Admin seed failed:',
                adminError instanceof Error ? adminError.message : String(adminError)
            );
        }

        try {
            const seedResult = await seedFromBackupIfNeeded({ ensureAdmin: true });
            if (seedResult.seeded) {
                console.log(`Auto-seed loaded data from ${seedResult.backupDir}`);
            } else if (seedResult.reason === 'auto-seed-disabled') {
                console.log('Auto-seed is disabled');
            }
        } catch (seedError) {
            console.warn(
                'Auto-seed failed:',
                seedError instanceof Error ? seedError.message : String(seedError)
            );
        }

        try {
            const resourceSeed = await seedResourcesIfNeeded();
            if (resourceSeed.seeded) {
                console.log(`Auto resources seeded: ${resourceSeed.count}`);
            }
        } catch (resourceError) {
            console.warn(
                'Auto resource seed failed:',
                resourceError instanceof Error ? resourceError.message : String(resourceError)
            );
        }

        app.listen(PORT, () => {
            console.log('');
            console.log('╔════════════════════════════════════════════════════════════════╗');
            console.log('║          SkillTrack Backend Server Started Successfully        ║');
            console.log(`║  Server running on: http://localhost:${PORT}${' '.repeat(24 - PORT.toString().length)}  ║`);
            console.log(`║  Environment: ${process.env.NODE_ENV || 'development'}${' '.repeat(41 - (process.env.NODE_ENV || 'development').length)}        ║`);
            console.log('║  Database: MongoDB connected                                   ║');
            console.log('╚════════════════════════════════════════════════════════════════╝');
            console.log('');
        });
    } catch (error) {
        console.error('✗ Failed to start server:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
};

// Graceful Shutdown
process.on('SIGINT', async () => {
    console.log('\n✓ Received SIGINT signal. Performing graceful shutdown...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n✓ Received SIGTERM signal. Performing graceful shutdown...');
    process.exit(0);
});

startServer();
