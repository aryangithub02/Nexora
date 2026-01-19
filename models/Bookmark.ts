import mongoose, { Schema, model, models } from "mongoose";

export interface IBookmark {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    videoId: mongoose.Types.ObjectId;
    revisitCount: number; // For sorting by memory, not time
    lastVisitedAt: Date;
    createdAt: Date;
}

const bookmarkSchema = new Schema<IBookmark>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        videoId: { type: Schema.Types.ObjectId, ref: "Video", required: true },
        revisitCount: { type: Number, default: 0 },
        lastVisitedAt: { type: Date, default: Date.now },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// Unique compound index to prevent duplicate bookmarks
bookmarkSchema.index({ userId: 1, videoId: 1 }, { unique: true });

// Index for fetching user's bookmarks sorted by memory (revisitCount)
bookmarkSchema.index({ userId: 1, revisitCount: -1 });

// Index for fetching user's bookmarks sorted by last visit
bookmarkSchema.index({ userId: 1, lastVisitedAt: -1 });

const Bookmark = models.Bookmark || model<IBookmark>("Bookmark", bookmarkSchema);

export default Bookmark;
