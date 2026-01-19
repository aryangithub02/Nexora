import UserInteraction from "@/models/UserInteraction";
import User from "@/models/User";
import mongoose from "mongoose";

// Track when a user watches a video
export async function trackVideoWatch(
    userId: mongoose.Types.ObjectId,
    videoId: mongoose.Types.ObjectId,
    duration?: number
) {
    try {
        await UserInteraction.create({
            userId,
            videoId,
            type: 'watch',
            duration
        });

        // Update user's current activity
        await User.findByIdAndUpdate(userId, {
            lastActive: new Date(),
            currentActivity: {
                type: 'watching',
                videoId,
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error('Error tracking video watch:', error);
    }
}

// Track when a user views a profile
export async function trackProfileView(
    userId: mongoose.Types.ObjectId,
    targetUserId: mongoose.Types.ObjectId
) {
    try {
        await UserInteraction.create({
            userId,
            targetUserId,
            type: 'profile_view'
        });
    } catch (error) {
        console.error('Error tracking profile view:', error);
    }
}

// Update user presence to idle
export async function updateUserIdle(userId: mongoose.Types.ObjectId) {
    try {
        await User.findByIdAndUpdate(userId, {
            lastActive: new Date(),
            currentActivity: {
                type: 'idle',
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error('Error updating user idle:', error);
    }
}
