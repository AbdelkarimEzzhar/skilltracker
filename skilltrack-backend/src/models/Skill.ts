import mongoose, { Document, Schema } from 'mongoose';

/**
 * Skill Document Interface
 * Alias model for competences collection
 */
export interface ISkill extends Document {
    code: string;
    name: string;
    description: string;
    domain?: string;
    category: string;
    level: string;
    difficulty?: number;
    estimatedDuration?: number;
    tags?: string[];
    institutionId?: string | mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const skillSchema = new Schema<ISkill>(
    {
        code: {
            type: String,
            required: [true, 'Skill code is required'],
            trim: true,
        },
        name: {
            type: String,
            required: [true, 'Skill name is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
        },
        domain: {
            type: String,
            trim: true,
        },
        category: {
            type: String,
            required: true,
        },
        level: {
            type: String,
            default: 'Beginner',
        },
        difficulty: Number,
        estimatedDuration: Number,
        tags: [String],
        institutionId: Schema.Types.Mixed,
    },
    {
        timestamps: true,
        collection: 'competences',
    }
);

export const Skill = mongoose.model<ISkill>('Skill', skillSchema);
