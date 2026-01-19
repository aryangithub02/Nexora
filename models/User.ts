import mongoose, { Schema, model, models } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser {
    email: string;
    password?: string;
    _id?: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
    followersCount?: number;
    followingCount?: number;
    lastActive?: Date;
    currentActivity?: {
        type: 'watching' | 'uploading' | 'idle';
        videoId?: mongoose.Types.ObjectId;
        timestamp?: Date;
    };
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    emailChangeToken?: string;
    emailChangeExpires?: Date;
    pendingEmail?: string;
    passwordUpdatedAt?: Date;
    tokenVersion?: number;
    // 2FA
    twoFactorEnabled?: boolean;
    twoFactorSecret?: string;
    backupCodes?: string[];

    // Privacy
    privacy?: {
        isPublic?: boolean;
        requireFollowApproval?: boolean;
        commentPermission?: 'everyone' | 'followers' | 'no_one';
        mentionPermission?: 'everyone' | 'followers';
        appearInDiscover?: boolean;
        allowSuggestions?: boolean;
    };

    // Deletion
    isDeleted?: boolean;
    deletedAt?: Date;
}

const userSchema = new mongoose.Schema<IUser>({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    currentActivity: {
        type: {
            type: String,
            enum: ['watching', 'uploading', 'idle'],
            default: 'idle'
        },
        videoId: { type: Schema.Types.ObjectId, ref: 'Video' },
        timestamp: { type: Date }
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // Email Change
    emailChangeToken: { type: String },
    emailChangeExpires: { type: Date },
    pendingEmail: { type: String },

    // Security
    passwordUpdatedAt: { type: Date },
    tokenVersion: { type: Number, default: 0 },

    // 2FA
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    backupCodes: [{ type: String }],

    // Privacy
    privacy: {
        isPublic: { type: Boolean, default: true },
        requireFollowApproval: { type: Boolean, default: false },
        commentPermission: {
            type: String,
            enum: ['everyone', 'followers', 'no_one'],
            default: 'everyone'
        },
        mentionPermission: {
            type: String,
            enum: ['everyone', 'followers'],
            default: 'everyone'
        },
        appearInDiscover: { type: Boolean, default: true },
        allowSuggestions: { type: Boolean, default: true }
    },

    // Deletion
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
},
    {
        timestamps: true
    }
);

userSchema.pre("save", async function () {
    if (this.isModified("password") && this.password) {
        this.password = await bcrypt.hash(this.password, 10);
    }
})

// Prevent duplicate model compilation in development
if (process.env.NODE_ENV === "development") {
    if (models.User) {
        delete models.User;
    }
}

const User = models.User || model<IUser>("User", userSchema);

export default User;