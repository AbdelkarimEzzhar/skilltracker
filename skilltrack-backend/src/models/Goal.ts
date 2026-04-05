import mongoose, { Document, Schema } from 'mongoose';

/**
 * Goal (Career/Learning Goal) Document Interface
 * Represents short-term and long-term career objectives
 */
export interface IGoal extends Document {
    studentId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    type: string;
    targetJobTitle?: string;
    status: string;
    priority: string | number;
    deadline: Date;
    progress: number; // 0-100
    relatedCompetences?: mongoose.Types.ObjectId[];
    resources?: {
        title: string;
        link?: string;
        type: string;
    }[];
    milestones?: {
        title: string;
        targetDate: Date;
        completed: boolean;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const goalSchema = new Schema<IGoal>(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'Student',
            required: [true, 'Student ID is required'],
        },
        title: {
            type: String,
            required: [true, 'Goal title is required'],
            trim: true,
            minlength: [3, 'Title must be at least 3 characters'],
        },
        description: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            default: 'Learning',
        },
        targetJobTitle: String,
        status: {
            type: String,
            default: 'Not Started',
        },
        priority: {
            type: Schema.Types.Mixed,
            default: 'Medium',
        },
        deadline: {
            type: Date,
            required: [true, 'Deadline is required'],
        },
        progress: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        relatedCompetences: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Competence',
            },
        ],
        resources: [
            {
                title: String,
                link: String,
                type: String,
            },
        ],
        milestones: [
            {
                title: String,
                targetDate: Date,
                completed: { type: Boolean, default: false },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Create indexes
goalSchema.index({ studentId: 1, status: 1 });
goalSchema.index({ deadline: 1 });
goalSchema.index({ status: 1, deadline: 1 });
goalSchema.index({ type: 1, status: 1 });
goalSchema.index({ priority: -1, deadline: 1 });

export const Goal = mongoose.model<IGoal>('Goal', goalSchema);
