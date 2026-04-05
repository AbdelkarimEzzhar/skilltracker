import mongoose, { Document, Schema } from 'mongoose';
import bcryptjs from 'bcryptjs';

/**
 * User Document Interface
 * Supports both ADMIN and STUDENT roles
 * Uses Single Table Inheritance pattern (via __t discriminator)
 */
export interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    role: 'ADMIN' | 'STUDENT';
    status: 'active' | 'inactive';
    emailVerified?: boolean;
    profileCompleted?: boolean;
    onboardingCompleted?: boolean;
    bio?: string;
    location?: string;
    phone?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IStudent extends IUser {
    filiereId: mongoose.Types.ObjectId;
    niveau?: string; // e.g., "1A", "INE2"
    promotion?: number; // e.g., 2024
    groupeId?: string;
    expectedGraduation?: Date;
}

const userSchema = new Schema<IUser>(
    {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
            minlength: [2, 'First name must be at least 2 characters'],
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
            minlength: [2, 'Last name must be at least 2 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
        },
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            lowercase: true,
            minlength: [3, 'Username must be at least 3 characters'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Don't return password by default
        },
        role: {
            type: String,
            enum: ['ADMIN', 'STUDENT', 'admin', 'student'],
            default: 'STUDENT',
            set: (value: string) => value?.toUpperCase(),
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        profileCompleted: {
            type: Boolean,
            default: false,
        },
        onboardingCompleted: {
            type: Boolean,
            default: false,
        },
        bio: {
            type: String,
            trim: true,
        },
        location: {
            type: String,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        linkedinUrl: {
            type: String,
            trim: true,
        },
        githubUrl: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
        discriminatorKey: '__t',
    }
);

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    if (this.password?.startsWith('$2a$') || this.password?.startsWith('$2b$')) {
        return next();
    }

    try {
        const salt = await bcryptjs.genSalt(10);
        this.password = await bcryptjs.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcryptjs.compare(candidatePassword, this.password);
};

// Create indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });

export const User = mongoose.model<IUser>('User', userSchema);

/**
 * Student Schema
 * Extends User with STUDENT-specific fields
 */
const studentSchema = new Schema<IStudent>(
    {
        filiereId: {
            type: Schema.Types.ObjectId,
            ref: 'Filiere',
            required: false,
        },
        niveau: {
            type: String,
            required: false,
        },
        promotion: {
            type: Number,
            required: false,
        },
        groupeId: String,
        expectedGraduation: {
            type: Date,
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

// Create partial indexes for Student documents only
studentSchema.index({ filiereId: 1, niveau: 1 }, { partialFilterExpression: { __t: 'Student' } });
studentSchema.index({ promotion: 1, groupeId: 1 }, { partialFilterExpression: { __t: 'Student' } });
studentSchema.index({ expectedGraduation: 1 }, { partialFilterExpression: { __t: 'Student' } });

export const Student = User.discriminator<IStudent>('Student', studentSchema);
