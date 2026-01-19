import mongoose, { Schema, model, models } from "mongoose";

export interface IBlocked {
    blockerId: mongoose.Types.ObjectId;
    blockedId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const blockedSchema = new Schema<IBlocked>(
    {
        blockerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        blockedId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

blockedSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

const Blocked = models.Blocked || model<IBlocked>("Blocked", blockedSchema);

export default Blocked;
