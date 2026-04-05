import mongoose, { Document, Schema } from 'mongoose';

/**
 * Activity Profile Document Interface
 * Tracks gamification metrics for student engagement
 * Unique: one profile per student
 */
export interface IActivityProfile extends Document {
    studentId: mongoose.Types.ObjectId;
    level: number; // 1, 2, 3, etc.
    experiencePoints: number;
    bonusExperiencePoints?: number;
    currentStreakDays: number;
    longestStreakDays: number;
    totalHours: number; // Total study/practice hours
    lastActivityDate: Date;
    totalActivities: number;
    activityHistory?: {
        date: Date;
        activity: string;
        pointsEarned: number;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const activityProfileSchema = new Schema<IActivityProfile>(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'Student',
            required: [true, 'Student ID is required'],
            unique: true,
        },
        level: {
            type: Number,
            default: 1,
            min: 1,
        },
        experiencePoints: {
            type: Number,
            default: 0,
            min: 0,
        },
        bonusExperiencePoints: {
            type: Number,
            default: 0,
            min: 0,
        },
        currentStreakDays: {
            type: Number,
            default: 0,
            min: 0,
        },
        longestStreakDays: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalHours: {
            type: Number,
            default: 0,
            min: 0,
        },
        lastActivityDate: {
            type: Date,
            default: () => new Date(),
        },
        totalActivities: {
            type: Number,
            default: 0,
            min: 0,
        },
        activityHistory: [
            {
                date: Date,
                activity: String,
                pointsEarned: Number,
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Create indexes for leaderboards and queries
activityProfileSchema.index({ studentId: 1 });
activityProfileSchema.index({ level: -1, experiencePoints: -1 });
activityProfileSchema.index({ currentStreakDays: -1 });
activityProfileSchema.index({ totalHours: -1 });
activityProfileSchema.index({ lastActivityDate: -1 });

export const ActivityProfile = mongoose.model<IActivityProfile>('ActivityProfile', activityProfileSchema);
