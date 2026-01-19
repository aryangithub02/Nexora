import mongoose, { Schema, model, models } from "mongoose";

export type ShareType = 'copy_link' | 'send_user' | 'external';

export interface IShare {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    videoId: mongoose.Types.ObjectId;
    shareType: ShareType;
    recipientId?: mongoose.Types.ObjectId; // For 'send_user' type
    externalPlatform?: string; // For 'external' type
    createdAt: Date;
}

const shareSchema = new Schema<IShare>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        videoId: { type: Schema.Types.ObjectId, ref: "Video", required: true },
        shareType: {
            type: String,
            enum: ['copy_link', 'send_user', 'external'],
            required: true
        },
        recipientId: { type: Schema.Types.ObjectId, ref: "User" },
        externalPlatform: { type: String },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// Index for counting shares on a video
shareSchema.index({ videoId: 1 });

// Index for user's shares
shareSchema.index({ userId: 1, createdAt: -1 });

const Share = models.Share || model<IShare>("Share", shareSchema);

export default Share;
