import mongoose, { Document, Schema } from 'mongoose';

/**
 * Competence (Skill) Document Interface
 * Represents technical, soft skills, or tools
 * Includes popularity scoring and text search capability
 */
export interface ICompetence extends Document {
    code: string;
    name: string;
    description: string;
    detailedDescription?: string;
    domain: string;
    category: string;
    level: string;
    difficulty: number; // 1-10
    estimatedDuration?: number; // in hours
    tags: string[];
    language?: string;
    popularityScore: number;
    institutionId?: string | mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const competenceSchema = new Schema<ICompetence>(
    {
        code: {
            type: String,
            required: [true, 'Skill code is required'],
            unique: true,
            uppercase: true,
        },
        name: {
            type: String,
            required: [true, 'Skill name is required'],
            trim: true,
            minlength: [2, 'Skill name must be at least 2 characters'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
        },
        detailedDescription: String,
        domain: {
            type: String,
            required: [true, 'Domain is required'],
            trim: true,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
        },
        level: {
            type: String,
            default: 'Beginner',
        },
        difficulty: {
            type: Number,
            min: 1,
            max: 10,
            default: 5,
        },
        estimatedDuration: Number, // in hours
        tags: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],
        language: {
            type: String,
            default: 'english',
        },
        popularityScore: {
            type: Number,
            default: 0,
            min: 0,
        },
        institutionId: Schema.Types.Mixed,
    },
    {
        timestamps: true,
    }
);

// Create text search index
competenceSchema.index({ name: 'text', description: 'text', detailedDescription: 'text' }, { language_override: 'language' });

// Create compound indexes
competenceSchema.index({ code: 1 });
competenceSchema.index({ code: 1, institutionId: 1 });
competenceSchema.index({ domain: 1, category: 1, level: 1 });
competenceSchema.index({ tags: 1 });
competenceSchema.index({ popularityScore: -1 });

export const Competence = mongoose.model<ICompetence>('Competence', competenceSchema);
