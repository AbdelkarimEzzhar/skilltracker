import mongoose, { Document, Schema } from 'mongoose';

/**
 * Filiere (Specialization/Program) Document Interface
 * Represents academic programs or specialization paths
 */
export interface IFiliere extends Document {
    titre: string;
    description: string;
    abbreviation?: string;
    isActive: boolean;
    anneeCreation: number;
    requiredCredits?: number;
    language?: string;
    createdAt: Date;
    updatedAt: Date;
}

const filiereSchema = new Schema<IFiliere>(
    {
        titre: {
            type: String,
            required: [true, 'Specialization title is required'],
            unique: true,
            trim: true,
            minlength: [2, 'Title must be at least 2 characters'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
        },
        abbreviation: {
            type: String,
            uppercase: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        anneeCreation: {
            type: Number,
            required: true,
            min: 1990,
            max: new Date().getFullYear(),
        },
        requiredCredits: Number,
        language: {
            type: String,
            default: 'english',
        },
    },
    {
        timestamps: true,
    }
);

// Create text search index
filiereSchema.index({ titre: 'text', description: 'text' }, { language_override: 'language' });

// Create other indexes
filiereSchema.index({ titre: 1 });
filiereSchema.index({ isActive: 1, anneeCreation: -1 });

export const Filiere = mongoose.model<IFiliere>('Filiere', filiereSchema);
