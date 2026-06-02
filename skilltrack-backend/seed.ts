import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './src/config/database';
import { seedFromBackup } from './src/utils/backup-seed';

dotenv.config();

const seed = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await connectDatabase();

        const result = await seedFromBackup({ ensureAdmin: true });
        console.log(`Seeding completed successfully from ${result.backupDir}`);
    } catch (error) {
        console.error('Seeding failed:', error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    } finally {
        await disconnectDatabase();
    }
};

seed();
