import mongoose, { Document, Schema } from 'mongoose';

/**
 * Stores trained AI recommendation model parameters.
 */
export interface IAIRecommendationModel extends Document {
    modelKey: string;
    version: string;
    weights: number[];
    bias: number;
    featureNames: string[];
    trainingSamples: number;
    accuracy: number;
    lastTrainedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const aiRecommendationModelSchema = new Schema<IAIRecommendationModel>(
    {
        modelKey: {
            type: String,
            required: true,
            unique: true,
            default: 'default',
        },
        version: {
            type: String,
            default: '1.0.0',
        },
        weights: {
            type: [Number],
            default: [],
        },
        bias: {
            type: Number,
            default: 0,
        },
        featureNames: {
            type: [String],
            default: [],
        },
        trainingSamples: {
            type: Number,
            default: 0,
            min: 0,
        },
        accuracy: {
            type: Number,
            default: 0,
            min: 0,
            max: 1,
        },
        lastTrainedAt: {
            type: Date,
            default: () => new Date(),
        },
    },
    {
        timestamps: true,
        collection: 'ai_recommendation_models',
    }
);

aiRecommendationModelSchema.index({ modelKey: 1 }, { unique: true });
aiRecommendationModelSchema.index({ lastTrainedAt: -1 });

export const AIRecommendationModel = mongoose.model<IAIRecommendationModel>(
    'AIRecommendationModel',
    aiRecommendationModelSchema
);
