import mongoose, { Schema, model, models } from "mongoose";

export interface IUserInteraction {
    userId: mongoose.Types.ObjectId;
    targetUserId?: mongoose.Types.ObjectId;
    videoId?: mongoose.Types.ObjectId;
    type: 'watch' | 'like' | 'comment' | 'profile_view';
    duration?: number; // For watch interactions
    createdAt: Date;
}

const userInteractionSchema = new Schema<IUserInteraction>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        targetUserId: { type: Schema.Types.ObjectId, ref: "User" },
        videoId: { type: Schema.Types.ObjectId, ref: "Video" },
        type: {
            type: String,
            enum: ['watch', 'like', 'comment', 'profile_view'],
            required: true
        },
        duration: { type: Number }, // in seconds
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// Indexes for efficient queries
userInteractionSchema.index({ userId: 1, createdAt: -1 });
userInteractionSchema.index({ userId: 1, videoId: 1 });
userInteractionSchema.index({ userId: 1, targetUserId: 1 });

const UserInteraction = models.UserInteraction || model<IUserInteraction>("UserInteraction", userInteractionSchema);

export default UserInteraction;
