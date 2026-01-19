import mongoose, { Schema, model, models } from "mongoose";

export interface IFollowRequest {
    requesterId: mongoose.Types.ObjectId;
    recipientId: mongoose.Types.ObjectId;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
}

const followRequestSchema = new Schema<IFollowRequest>(
    {
        requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

followRequestSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

const FollowRequest = models.FollowRequest || model<IFollowRequest>("FollowRequest", followRequestSchema);

export default FollowRequest;
