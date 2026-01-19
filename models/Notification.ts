import mongoose, { Schema, model, models } from "mongoose";

export interface INotification {
    recipient: mongoose.Types.ObjectId; // User receiving the notification
    actor: mongoose.Types.ObjectId;     // User performing the action
    type: "like" | "comment" | "follow" | "mention" | "follow_request" | "follow_accepted";
    entityId?: mongoose.Types.ObjectId; // ID of the Reel or Comment or FollowRequest
    entityType?: "Reel" | "Comment" | "User" | "FollowRequest"; // What are we linking to?
    text?: string; // Preview text (e.g., comment content fragment)
    read: boolean;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
        type: {
            type: String,
            enum: ["like", "comment", "follow", "mention", "follow_request", "follow_accepted"],
            required: true
        },
        entityId: { type: Schema.Types.ObjectId }, // No ref here to allow dynamic linking based on entityType
        entityType: { type: String, enum: ["Reel", "Comment", "User", "FollowRequest"] },
        text: { type: String, maxlength: 100 }, // Short snippet if needed
        read: { type: Boolean, default: false, index: true },
    },
    {
        timestamps: true
    }
);

// Indexes for faster queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

const Notification = models.Notification || model<INotification>("Notification", notificationSchema);

export default Notification;
