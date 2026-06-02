import mongoose, { Document, Schema } from 'mongoose';

/**
 * Resource Document Interface
 * Represents learning resources used by the recommendation engine.
 */
export interface IResource extends Document {
    title: string;
    type: 'Course' | 'Certification' | 'Book' | 'Project';
    link?: string;
    description: string;
    requiredSkills: mongoose.Types.ObjectId[];
    estimatedHours: number;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    sourceId?: mongoose.Types.ObjectId | string;
    sourceType?: string;
    createdAt: Date;
    updatedAt: Date;
}

const resourceSchema = new Schema<IResource>(
    {
        title: {
            type: String,
            required: [true, 'Resource title is required'],
            trim: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['Course', 'Certification', 'Book', 'Project'],
        },
        link: String,
        description: {
            type: String,
            required: [true, 'Resource description is required'],
            trim: true,
        },
        requiredSkills: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Competence',
            },
        ],
        estimatedHours: {
            type: Number,
            default: 4,
            min: 0,
        },
        difficulty: {
            type: String,
            enum: ['Beginner', 'Intermediate', 'Advanced'],
            default: 'Intermediate',
        },
        sourceId: Schema.Types.Mixed,
        sourceType: String,
    },
    {
        timestamps: true,
        collection: 'resources',
    }
);

resourceSchema.index({ type: 1, difficulty: 1 });
resourceSchema.index({ requiredSkills: 1 });
resourceSchema.index({ sourceId: 1, sourceType: 1 });
resourceSchema.index({ title: 'text', description: 'text' });

export const Resource = mongoose.model<IResource>('Resource', resourceSchema);
