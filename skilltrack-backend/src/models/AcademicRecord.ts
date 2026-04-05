import mongoose, { Document, Schema } from 'mongoose';

/**
 * Academic Record Document Interface
 * Tracks academic courses, semesters, and linked skills
 */
export interface IAcademicRecord extends Document {
    userId: mongoose.Types.ObjectId;
    semester: string;
    courses: Array<{
        title: string;
        grade?: string;
        credits?: number;
        linkedSkills?: mongoose.Types.ObjectId[];
    }>;
    linkedSkills?: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const academicRecordSchema = new Schema<IAcademicRecord>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
        },
        semester: {
            type: String,
            required: true,
            trim: true,
        },
        courses: [
            {
                title: { type: String, required: true },
                grade: String,
                credits: Number,
                linkedSkills: [{ type: Schema.Types.ObjectId, ref: 'Competence' }],
            },
        ],
        linkedSkills: [{ type: Schema.Types.ObjectId, ref: 'Competence' }],
    },
    {
        timestamps: true,
        collection: 'academic_records',
    }
);

academicRecordSchema.index({ userId: 1, semester: 1 }, { unique: true });

export const AcademicRecord = mongoose.model<IAcademicRecord>('AcademicRecord', academicRecordSchema);
