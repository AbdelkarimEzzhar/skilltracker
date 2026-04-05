import mongoose, { Document, Schema } from 'mongoose';

/**
 * Achievement (Badge/Milestone) Document Interface
 * Represents gamification elements: badges, milestones, achievements
 */
export interface IAchievement extends Document {
    studentId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    icon?: string; // URL or emoji
    category: string;
    rarity: string;
    points: number;
    unlockedAt: Date;
    relatedCompetence?: mongoose.Types.ObjectId;
    requirements?: {
        type: string;
        value: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const achievementSchema = new Schema<IAchievement>(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'Student',
            required: [true, 'Student ID is required'],
        },
        title: {
            type: String,
            required: [true, 'Achievement title is required'],
            trim: true,
            minlength: [3, 'Title must be at least 3 characters'],
        },
        description: {
            type: String,
            trim: true,
        },
        icon: String,
        category: {
            type: String,
            default: 'Custom',
        },
        rarity: {
            type: String,
            default: 'Uncommon',
        },
        points: {
            type: Number,
            default: 10,
            min: 0,
        },
        unlockedAt: {
            type: Date,
            default: () => new Date(),
        },
        relatedCompetence: Schema.Types.ObjectId,
        requirements: {
            type: { type: String },
            value: Number,
        },
    },
    {
        timestamps: true,
    }
);

// Create indexes
achievementSchema.index({ studentId: 1, rarity: 1 });
achievementSchema.index({ unlockedAt: -1 });
achievementSchema.index({ studentId: 1, unlockedAt: -1 });
achievementSchema.index({ studentId: 1, category: 1 });
achievementSchema.index({ rarity: 1, category: 1 });

export const Achievement = mongoose.model<IAchievement>('Achievement', achievementSchema);
