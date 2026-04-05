import mongoose, { Document, Schema } from 'mongoose';

/**
 * Recommendation Document Interface
 * Stores AI-like recommendations for students
 */
export interface IRecommendation extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'Course' | 'Certification' | 'Book' | 'Project' | 'CareerPath';
    title: string;
    description: string;
    link?: string;
    priority: 'High' | 'Medium' | 'Low';
    estimatedHours: number;
    reason: string;
    status: 'Active' | 'Completed' | 'Ignored';
    isCompleted: boolean;
    progressPercent: number;
    sourceId?: mongoose.Types.ObjectId | string;
    sourceType?: string;
    aiFeatures?: Record<string, number>;
    aiProbability?: number;
    createdAt: Date;
    updatedAt: Date;
}

const recommendationSchema = new Schema<IRecommendation>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        link: String,
        priority: {
            type: String,
            enum: ['High', 'Medium', 'Low'],
            default: 'Medium',
        },
        estimatedHours: {
            type: Number,
            default: 5,
            min: 0,
        },
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ['Active', 'Completed', 'Ignored'],
            default: 'Active',
        },
        isCompleted: {
            type: Boolean,
            default: false,
        },
        progressPercent: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        sourceId: Schema.Types.Mixed,
        sourceType: String,
        aiFeatures: {
            type: Map,
            of: Number,
            default: undefined,
        },
        aiProbability: {
            type: Number,
            min: 0,
            max: 1,
        },
    },
    {
        timestamps: true,
        collection: 'recommendations',
    }
);

recommendationSchema.index({ userId: 1, type: 1 });
recommendationSchema.index({ userId: 1, status: 1 });
recommendationSchema.index({ userId: 1, priority: 1 });
recommendationSchema.index({ userId: 1, sourceId: 1 });

export const Recommendation = mongoose.model<IRecommendation>('Recommendation', recommendationSchema);
