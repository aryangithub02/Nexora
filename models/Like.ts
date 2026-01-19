import mongoose, { Schema, model, models } from "mongoose";

export interface ILike {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    videoId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const likeSchema = new Schema<ILike>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        videoId: { type: Schema.Types.ObjectId, ref: "Video", required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// Unique compound index to prevent duplicate likes
likeSchema.index({ userId: 1, videoId: 1 }, { unique: true });

// Index for counting likes on a video
likeSchema.index({ videoId: 1 });

const Like = models.Like || model<ILike>("Like", likeSchema);

export default Like;
