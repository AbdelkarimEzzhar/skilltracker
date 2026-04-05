import mongoose, { Document, Schema } from 'mongoose';

/**
 * Specialty (Academic Program) Document Interface
 * Alias model for filieres collection
 */
export interface ISpecialty extends Document {
    titre: string;
    name?: string;
    description: string;
    requiredSkills?: mongoose.Types.ObjectId[];
    abbreviation?: string;
    isActive?: boolean;
    anneeCreation?: number;
    requiredCredits?: number;
    language?: string;
    createdAt: Date;
    updatedAt: Date;
}

const specialtySchema = new Schema<ISpecialty>(
    {
        titre: {
            type: String,
            required: [true, 'Specialty name is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
        },
        requiredSkills: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Competence',
            },
        ],
        abbreviation: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        anneeCreation: Number,
        requiredCredits: Number,
        language: String,
    },
    {
        timestamps: true,
        collection: 'filieres',
    }
);

specialtySchema.virtual('name')
    .get(function (this: any) {
        return this.titre;
    })
    .set(function (this: any, value: string) {
        this.titre = value;
    });

export const Specialty = mongoose.model<ISpecialty>('Specialty', specialtySchema);
