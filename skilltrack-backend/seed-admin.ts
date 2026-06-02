import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ensureAdminUser } from './src/utils/backup-seed';

dotenv.config();

/**
 * Seed Script to Create Admin User
 * Run with: npm run seed:admin
 */
async function seedAdmin() {
    try {
        // Connect to MongoDB
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI not defined in .env');
        }

        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const result = await ensureAdminUser();

        if (!result.created) {
            console.log('Admin user already exists');
            console.log(`   Email: ${result.email}`);
            await mongoose.connection.close();
            return;
        }

        console.log('Admin user created successfully');
        console.log(`   Email: ${result.email}`);
        console.log(`   Password: ${result.password}`);

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedAdmin();
