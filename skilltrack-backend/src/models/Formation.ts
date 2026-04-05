import mongoose, { Document, Schema } from 'mongoose';

/**
 * Formation (Course/Training) Document Interface
 * Represents educational resources: courses, certifications, projects
 * Includes platform information and competence coverage
 */
export interface IFormation extends Document {
    title: string;
    description: string;
    type: string;
    level: string;
    platform: string;
    link?: string;
    isCertified: boolean;
    duration?: number; // in hours
    averageRating?: number; // 0-5
    studentCount?: number;
    coveredCompetences: Array<mongoose.Types.ObjectId | string>;
    costType?: 'Free' | 'Paid' | 'Premium';
    createdAt: Date;
    updatedAt: Date;
}

const formationSchema = new Schema<IFormation>(
    {
        title: {
            type: String,
            required: [true, 'Formation title is required'],
            trim: true,
            minlength: [3, 'Title must be at least 3 characters'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
        },
        type: {
            type: String,
            default: 'Course',
        },
        level: {
            type: String,
            default: 'Intermediate',
        },
        platform: {
            type: String,
            required: [true, 'Platform is required'],
            trim: true,
        },
        link: String,
        isCertified: {
            type: Boolean,
            default: false,
        },
        duration: Number, // in hours
        averageRating: {
            type: Number,
            min: 0,
            max: 5,
        },
        studentCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        coveredCompetences: [
            {
                type: Schema.Types.Mixed,
            },
        ],
        costType: {
            type: String,
            enum: ['Free', 'Paid', 'Premium'],
            default: 'Free',
        },
    },
    {
        timestamps: true,
    }
);

// Create text search index
formationSchema.index({ title: 'text', description: 'text' });

// Create other indexes
formationSchema.index({ type: 1, level: 1 });
formationSchema.index({ platform: 1, isCertified: 1 });
formationSchema.index({ averageRating: -1 });
formationSchema.index({ studentCount: -1 });
formationSchema.index({ coveredCompetences: 1 });

export const Formation = mongoose.model<IFormation>('Formation', formationSchema);
