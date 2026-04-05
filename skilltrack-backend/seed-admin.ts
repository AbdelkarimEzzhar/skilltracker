import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import { User } from './src/models/User';
import { ActivityProfile } from './src/models/ActivityProfile';

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

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@skilltrack.com' });
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log('   Email: admin@skilltrack.com');
            console.log('   Password: Admin@123');

            // Update password if needed
            const response = await mongoose.connection.collection('users').findOne({
                email: 'admin@skilltrack.com'
            });
            console.log('   Current data:', response);

            await mongoose.connection.close();
            return;
        }

        // Create admin user
        console.log('👤 Creating admin user...');
        const adminUser = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@skilltrack.com',
            username: 'admin',
            password: 'Admin@123',
            role: 'ADMIN',
            status: 'active',
        });

        await adminUser.save();
        console.log('✅ Admin user created successfully!');
        console.log('   Email: admin@skilltrack.com');
        console.log('   Password: Admin@123');
        console.log('   Role: ADMIN');

        // Create activity profile for admin
        const activityProfile = new ActivityProfile({
            studentId: adminUser._id,
            level: 1,
            experiencePoints: 0,
            currentStreakDays: 0,
            longestStreakDays: 0,
            totalHours: 0,
            totalActivities: 0,
            lastActivityDate: new Date(),
        });
        await activityProfile.save();
        console.log('✅ Activity profile created');

        console.log('\n✨ Seeding completed successfully!');
        console.log('🚀 You can now login with:');
        console.log('   Email: admin@skilltrack.com');
        console.log('   Password: Admin@123');

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedAdmin();
