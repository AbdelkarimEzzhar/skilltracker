import mongoose, { Document, Schema } from 'mongoose';

/**
 * Student Competence Assessment Document Interface
 * Tracks individual student progress on each competence
 * Unique constraint: one assessment per student per competence
 */
export interface IStudentCompetence extends Document {
    studentId: mongoose.Types.ObjectId;
    competenceId: mongoose.Types.ObjectId;
    status: 'Not Started' | 'In Progress' | 'Mastered' | 'Reviewed';
    confidenceScore: number; // 0-100, self-assessed
    progressPercentage: number; // 0-100
    practiceCount: number;
    lastPracticed: Date;
    assessmentDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const studentCompetenceSchema = new Schema<IStudentCompetence>(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'Student',
            required: [true, 'Student ID is required'],
        },
        competenceId: {
            type: Schema.Types.ObjectId,
            ref: 'Competence',
            required: [true, 'Competence ID is required'],
        },
        status: {
            type: String,
            enum: ['Not Started', 'In Progress', 'Mastered', 'Reviewed', 'acquired', 'mastered', 'in_progress'],
            default: 'Not Started',
        },
        confidenceScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        progressPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        practiceCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        lastPracticed: {
            type: Date,
            default: () => new Date(),
        },
        assessmentDate: Date,
        notes: String,
    },
    {
        timestamps: true,
    }
);

// Unique constraint: one competence per student
studentCompetenceSchema.index({ studentId: 1, competenceId: 1 }, { unique: true });

// Other indexes for querying
studentCompetenceSchema.index({ studentId: 1, status: 1 });
studentCompetenceSchema.index({ competenceId: 1, status: 1 });
studentCompetenceSchema.index({ lastPracticed: -1 });
studentCompetenceSchema.index({ confidenceScore: -1 });

export const StudentCompetence = mongoose.model<IStudentCompetence>('StudentCompetence', studentCompetenceSchema);
