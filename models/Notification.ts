import mongoose, { Schema, model, models } from "mongoose";

export interface INotification {
    recipient: mongoose.Types.ObjectId; 
    actor: mongoose.Types.ObjectId;     
    type: "like" | "comment" | "follow" | "mention" | "follow_request" | "follow_accepted";
    entityId?: mongoose.Types.ObjectId; 
    entityType?: "Reel" | "Comment" | "User" | "FollowRequest"; 
    text?: string; 
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
        entityId: { type: Schema.Types.ObjectId }, 
        entityType: { type: String, enum: ["Reel", "Comment", "User", "FollowRequest"] },
        text: { type: String, maxlength: 100 }, 
        read: { type: Boolean, default: false, index: true },
    },
    {
        timestamps: true
    }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

const Notification = models.Notification || model<INotification>("Notification", notificationSchema);

export default Notification;
