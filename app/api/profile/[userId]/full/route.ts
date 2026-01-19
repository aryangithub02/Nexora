import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Follow from "@/models/Follow";
import Profile from "@/models/Profile";
import mongoose from "mongoose";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const { userId } = await params;

        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser) {
            return NextResponse.json({ error: "Current user not found" }, { status: 404 });
        }

        // Get target user
        const targetUser = await User.findById(userId)
            .select('_id email followersCount followingCount lastActive createdAt privacy');

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get profile
        const profile = await Profile.findOne({ userId: targetUser._id });

        // Check if current user follows this user
        const follow = await Follow.findOne({
            followerId: currentUser._id,
            followingId: targetUser._id
        });

        let followState: 'following' | 'requested' | 'not_following' = 'not_following';

        if (follow) {
            followState = 'following';
        } else {
            // Check for pending request
            const { default: FollowRequest } = await import("@/models/FollowRequest");
            const request = await FollowRequest.findOne({
                requesterId: currentUser._id,
                recipientId: targetUser._id,
                status: 'pending'
            });
            if (request) {
                followState = 'requested';
            }
        }

        // Check if online (active in last 5 min)
        const activeThreshold = new Date(Date.now() - 5 * 60 * 1000);
        const isOnline = targetUser.lastActive && new Date(targetUser.lastActive) > activeThreshold;

        return NextResponse.json({
            profile: {
                _id: targetUser._id,
                email: targetUser.email,
                displayName: profile?.displayName || targetUser.email?.split('@')[0] || 'User',
                username: profile?.username,
                bio: profile?.bio || '',
                avatarUrl: profile?.avatarUrl,
                bannerUrl: profile?.bannerUrl,
                followersCount: targetUser.followersCount || 0,
                followingCount: targetUser.followingCount || 0,
                isFollowing: !!follow,
                followState, // Add explicit state
                isOwnProfile: currentUser._id?.toString() === targetUser._id?.toString(),
                isOnline,
                joinedAt: targetUser.createdAt,
                isPrivate: targetUser.privacy?.isPublic === false
            }
        });

    } catch (error: any) {
        console.error("Error fetching full profile:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}
