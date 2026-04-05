import mongoose, { Document, Schema } from 'mongoose';

/**
 * Career Goal Document Interface
 * Alias model for goals collection focused on career objectives
 */
export interface ICareerGoal extends Document {
    studentId: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    targetJobTitle?: string;
    timeline?: string;
    progress: number;
    status: string;
    priority?: string | number;
    createdAt: Date;
    updatedAt: Date;
}

const careerGoalSchema = new Schema<ICareerGoal>(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        targetJobTitle: String,
        timeline: String,
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        status: {
            type: String,
            default: 'Not Started',
        },
        priority: Schema.Types.Mixed,
    },
    {
        timestamps: true,
        collection: 'goals',
    }
);

careerGoalSchema.virtual('userId')
    .get(function (this: any) {
        return this.studentId;
    })
    .set(function (this: any, value: mongoose.Types.ObjectId) {
        this.studentId = value;
    });

export const CareerGoal = mongoose.model<ICareerGoal>('CareerGoal', careerGoalSchema);
