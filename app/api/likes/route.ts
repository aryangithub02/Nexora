import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Like from "@/models/Like";
import Video from "@/models/Video";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

// GET - Check if user liked a video and get like count
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get("videoId");

        if (!videoId) {
            return NextResponse.json({ error: "videoId is required" }, { status: 400 });
        }

        await connectToDatabase();

        const userId = new mongoose.Types.ObjectId((session.user as any).id);
        const videoObjectId = new mongoose.Types.ObjectId(videoId);

        // Check if user liked the video
        const userLike = await Like.findOne({ userId, videoId: videoObjectId });

        // Get total like count
        const likeCount = await Like.countDocuments({ videoId: videoObjectId });

        return NextResponse.json({
            isLiked: !!userLike,
            likeCount,
        });
    } catch (error) {
        console.error("Error checking like status:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Like a video (emotional impulse)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { videoId } = await request.json();

        if (!videoId) {
            return NextResponse.json({ error: "videoId is required" }, { status: 400 });
        }

        await connectToDatabase();

        const userId = new mongoose.Types.ObjectId((session.user as any).id);
        const videoObjectId = new mongoose.Types.ObjectId(videoId);

        // Check if video exists
        const video = await Video.findById(videoObjectId);
        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        // Try to create like (will fail if already exists due to unique index)
        try {
            await Like.create({ userId, videoId: videoObjectId });

            // Create Notification (Batched)
            if (video.uploadedBy && video.uploadedBy._id && video.uploadedBy._id.toString() !== userId.toString()) {
                const existingNotif = await Notification.findOne({
                    recipient: video.uploadedBy._id,
                    type: "like",
                    entityId: videoObjectId,
                    read: false
                });

                if (existingNotif) {
                    // Update existing notification to show latest actor and bump time
                    existingNotif.actor = userId;
                    // Force update timestamp
                    // @ts-ignore
                    existingNotif.createdAt = new Date();
                    await existingNotif.save();

                    // Real-time Emit (Update)


                } else {
                    const notification = await Notification.create({
                        recipient: video.uploadedBy._id,
                        actor: userId,
                        type: "like",
                        entityId: videoObjectId,
                        entityType: "Reel"
                    });

                    // Real-time Emit

                }
            }

        } catch (e: any) {
            if (e.code === 11000) {
                // Duplicate key error - already liked, which is fine
                return NextResponse.json({ success: true, alreadyLiked: true });
            }
            throw e;
        }

        // Get updated like count
        const likeCount = await Like.countDocuments({ videoId: videoObjectId });

        return NextResponse.json({
            success: true,
            likeCount,
        });
    } catch (error) {
        console.error("Error liking video:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Unlike a video
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { videoId } = await request.json();

        if (!videoId) {
            return NextResponse.json({ error: "videoId is required" }, { status: 400 });
        }

        await connectToDatabase();

        const userId = new mongoose.Types.ObjectId((session.user as any).id);
        const videoObjectId = new mongoose.Types.ObjectId(videoId);

        await Like.deleteOne({ userId, videoId: videoObjectId });

        // Get updated like count
        const likeCount = await Like.countDocuments({ videoId: videoObjectId });

        return NextResponse.json({
            success: true,
            likeCount,
        });
    } catch (error) {
        console.error("Error unliking video:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
