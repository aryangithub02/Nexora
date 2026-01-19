import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
    userId: mongoose.Types.ObjectId;
    ipAddress: string;
    userAgent: string;
    deviceType: string;
    location: string;
    lastActive: Date;
    createdAt: Date;
    isActive: boolean;
}

const SessionSchema = new Schema<ISession>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        ipAddress: { type: String, required: true },
        userAgent: { type: String, required: true },
        deviceType: { type: String, default: "Unknown" },
        location: { type: String, default: "Unknown" },
        lastActive: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Index for quick lookup and auto-expiry logic if needed
SessionSchema.index({ userId: 1, lastActive: -1 });

export default mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);
