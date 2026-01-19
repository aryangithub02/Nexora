import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Video from "@/models/Video";
import mongoose from "mongoose";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await connectToDatabase();
        const { userId } = await params;

        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        // Privacy Check
        const targetUser = await User.findById(userId).select('privacy');
        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isPublic = targetUser.privacy?.isPublic !== false; // Default true

        if (!isPublic) {
            const session = await getServerSession(authOptions);
            const currentUserId = session?.user ? (session.user as any).id : null;

            if (!currentUserId || currentUserId !== userId) {
                // Not owner, check follow
                if (!currentUserId) {
                    return NextResponse.json({ error: "Private account" }, { status: 403 });
                }

                const { default: Follow } = await import("@/models/Follow");
                const isFollowing = await Follow.exists({ followerId: currentUserId, followingId: userId });

                if (!isFollowing) {
                    return NextResponse.json({ error: "Private account" }, { status: 403 });
                }
            }
        }

        // Get videos by this user
        const videos = await Video.find({
            'uploadedBy._id': new mongoose.Types.ObjectId(userId)
        })
            .select('_id title description videoUrl thumbnailUrl createdAt')
            .sort({ createdAt: -1 })
            .limit(50);

        return NextResponse.json({
            videos: videos.map(v => ({
                _id: v._id,
                title: v.title,
                description: v.description,
                videoUrl: v.videoUrl,
                thumbnailUrl: v.thumbnailUrl,
                createdAt: v.createdAt
            }))
        });

    } catch (error: any) {
        console.error("Error fetching user videos:", error);
        return NextResponse.json(
            { error: "Failed to fetch videos" },
            { status: 500 }
        );
    }
}
