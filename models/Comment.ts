import mongoose, { Schema, model, models } from "mongoose";

export interface IComment {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    videoId: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
    updatedAt: Date;
    parentId?: mongoose.Types.ObjectId;
    likes?: mongoose.Types.ObjectId[];
    isDeleted?: boolean;
    deletedBy?: mongoose.Types.ObjectId;
    // Populated fields
    user?: {
        _id: mongoose.Types.ObjectId;
        email: string;
        displayName?: string;
        avatarUrl?: string;
    };
}

const commentSchema = new Schema<IComment>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        videoId: { type: Schema.Types.ObjectId, ref: "Video", required: true },
        text: { type: String, required: true, maxlength: 1000 },
        parentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
        likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
        isDeleted: { type: Boolean, default: false },
        deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

// Index for fetching comments on a video (newest first)
commentSchema.index({ videoId: 1, createdAt: -1 });

// Index for user's comments
commentSchema.index({ userId: 1, createdAt: -1 });

const Comment = models.Comment || model<IComment>("Comment", commentSchema);

export default Comment;
