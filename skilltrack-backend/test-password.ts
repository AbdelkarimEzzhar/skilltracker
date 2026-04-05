import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import { User } from './src/models/User';

dotenv.config();

async function testPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI!);
        
        // Find admin user
        const admin = await User.findOne({ email: 'admin@skilltrack.com' }).select('+password');
        console.log('Admin found:', !!admin);
        console.log('Admin password hash:', admin?.password);
        console.log('Admin email:', admin?.email);
        
        // Test password comparison
        if (admin) {
            const isValid = await admin.comparePassword('Admin@123');
            console.log('Password valid:', isValid);
            
            // Manual hash test
            const salt = await bcryptjs.genSalt(10);
            const hash = await bcryptjs.hash('Admin@123', salt);
            console.log('New hash:', hash);
            const manualCompare = await bcryptjs.compare('Admin@123', admin.password);
            console.log('Manual compare result:', manualCompare);
        }
        
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

testPassword();
