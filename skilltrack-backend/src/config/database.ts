import mongoose from 'mongoose';

/**
 * MongoDB Connection Configuration
 * Handles connection pooling and connection lifecycle
 * Uses HttpOnly cookies for JWT storage (security best practice)
 */
export const connectDatabase = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/skilltrack_db';

        await mongoose.connect(mongoUri, {
            // Connection pool size for production
            maxPoolSize: 10,
            minPoolSize: 5,
            // Connection timeout
            serverSelectionTimeoutMS: 5000,
            // Socket timeout
            socketTimeoutMS: 45000,
            // Enable automatic reconnection
            retryWrites: true,
            // For replica sets and sharding
            retryReads: true,
        });

        console.log(`✓ MongoDB connected successfully to ${mongoUri}`);

        // Handle connection events
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠ MongoDB disconnected');
        });

        mongoose.connection.on('error', (err) => {
            console.error('✗ MongoDB connection error:', err.message);
        });
    } catch (error) {
        console.error('✗ Failed to connect to MongoDB:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
};

/**
 * Disconnect from MongoDB
 * Useful for graceful shutdown
 */
export const disconnectDatabase = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
        console.log('✓ MongoDB disconnected safely');
    } catch (error) {
        console.error('✗ Error disconnecting from MongoDB:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
};
