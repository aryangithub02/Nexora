import mongoose, { Schema, model, models } from "mongoose";

export const VIDEO_CONTROL_DIMENSIONS = {
    width: 1080,
    height: 1920
} as const;
export interface IVideo {
    _id: mongoose.Types.ObjectId;
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl: string;
    uploadedBy?: {
        _id?: mongoose.Types.ObjectId;
        email?: string;
        name?: string;
        username?: string;
        displayName?: string;
        avatarUrl?: string;
        commentPermission?: 'everyone' | 'followers' | 'no_one';
    };
    controls?: boolean;
    transformation?: {
        height: number;
        width: number;
        quality?: number;
    }
    audioLufs?: number;
    audioPeak?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const videoSchema = new mongoose.Schema<IVideo>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    uploadedBy: {
        _id: { type: Schema.Types.ObjectId, ref: "User" },
        email: { type: String },
        name: { type: String },
    },
    controls: { type: Boolean, default: true },
    transformation: {
        height: { type: Number, default: VIDEO_CONTROL_DIMENSIONS.height },
        width: { type: Number, default: VIDEO_CONTROL_DIMENSIONS.width },
        quality: { type: Number, min: 1, max: 100, default: 75 },
    },
    audioLufs: { type: Number },
    audioPeak: { type: Number },

}, { timestamps: true });

const Video = models.Video || model<IVideo>("Video", videoSchema);

export default Video;