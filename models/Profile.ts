import mongoose, { Schema, model, models } from "mongoose";

export interface IProfile {
    userId: mongoose.Types.ObjectId;
    displayName?: string;
    username: string;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    themeAccent?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const profileSchema = new mongoose.Schema<IProfile>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    displayName: { type: String },
    username: { type: String, required: true, unique: true },
    bio: { type: String },
    avatarUrl: { type: String },
    bannerUrl: { type: String },
    themeAccent: { type: String, default: "#2DE2A6" }, // Default mint color
},
    {
        timestamps: true
    }
);

const Profile = models.Profile || model<IProfile>("Profile", profileSchema);

export default Profile;
