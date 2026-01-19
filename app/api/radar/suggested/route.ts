import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Follow from "@/models/Follow";
import Profile from "@/models/Profile";
import UserInteraction from "@/models/UserInteraction";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const currentUserId = currentUser._id as mongoose.Types.ObjectId;

        // Get users the current user already follows
        const following = await Follow.find({ followerId: currentUserId }).select('followingId');
        const followingIds = following.map(f => f.followingId);

        // Get recent interactions (last 7 days)
        const recentInteractions = await UserInteraction.find({
            userId: currentUserId,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }).select('targetUserId videoId type duration');

        // Get videos the user watched and find their creators
        const watchedVideoIds = recentInteractions
            .filter(i => i.type === 'watch' && i.videoId)
            .map(i => i.videoId);

        const Video = mongoose.models.Video;
        const watchedVideos = await Video.find({
            _id: { $in: watchedVideoIds }
        }).select('uploadedBy');

        const interactedCreatorIds = [...new Set(watchedVideos.map(v => v.uploadedBy))];

        // Find mutual followers (people who follow users you follow)
        const mutualFollowers = await Follow.aggregate([
            { $match: { followerId: { $in: followingIds } } },
            { $group: { _id: '$followingId', count: { $sum: 1 } } },
            { $match: { count: { $gte: 1 } } },
            { $limit: 20 }
        ]);

        const mutualFollowerIds = mutualFollowers.map(m => m._id);

        // Combine all potential suggestions
        const potentialSuggestionIds = [...new Set([
            ...interactedCreatorIds,
            ...mutualFollowerIds
        ])].filter(id =>
            !followingIds.some(fid => fid.toString() === id.toString()) &&
            id.toString() !== currentUserId.toString()
        );

        // Get user details
        const suggestedUsers = await User.find({
            _id: { $in: potentialSuggestionIds }
        }).select('_id email followersCount').limit(10);

        // Get profiles
        const suggestionIds = suggestedUsers.map(u => u._id);
        const profiles = await Profile.find({
            userId: { $in: suggestionIds }
        }).select('userId displayName username avatarUrl');

        // Check if user already follows these suggestions
        const existingFollows = await Follow.find({
            followerId: currentUserId,
            followingId: { $in: suggestionIds }
        });
        const alreadyFollowingIds = existingFollows.map(f => f.followingId.toString());

        // Build suggestion list with scoring
        const suggestions = suggestedUsers
            .filter(user => !alreadyFollowingIds.includes(user._id?.toString() || ''))
            .map(user => {
                const profile = profiles.find(p => p.userId?.toString() === user._id?.toString());

                // Simple scoring based on mutual connections and interactions
                let score = 0;
                if (mutualFollowerIds.some(id => id.toString() === user._id?.toString())) score += 2;
                if (interactedCreatorIds.some(id => id.toString() === user._id?.toString())) score += 3;
                score += (user.followersCount || 0) * 0.01; // Slight boost for popular users

                return {
                    _id: user._id,
                    email: user.email,
                    displayName: profile?.displayName || user.email?.split('@')[0] || 'Unknown',
                    username: profile?.username,
                    avatarUrl: profile?.avatarUrl,
                    followersCount: user.followersCount,
                    score
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        return NextResponse.json({
            suggestions,
            count: suggestions.length
        });

    } catch (error: any) {
        console.error("Suggested users error:", error);
        return NextResponse.json(
            { error: "Failed to fetch suggested users" },
            { status: 500 }
        );
    }
}
