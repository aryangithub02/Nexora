import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Like from "@/models/Like";
import Video from "@/models/Video";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

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

        const userLike = await Like.findOne({ userId, videoId: videoObjectId });

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

        const video = await Video.findById(videoObjectId);
        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        try {
            await Like.create({ userId, videoId: videoObjectId });

            if (video.uploadedBy && video.uploadedBy._id && video.uploadedBy._id.toString() !== userId.toString()) {
                const existingNotif = await Notification.findOne({
                    recipient: video.uploadedBy._id,
                    type: "like",
                    entityId: videoObjectId,
                    read: false
                });

                if (existingNotif) {
                    
                    existingNotif.actor = userId;

                    existingNotif.createdAt = new Date();
                    await existingNotif.save();

                } else {
                    const notification = await Notification.create({
                        recipient: video.uploadedBy._id,
                        actor: userId,
                        type: "like",
                        entityId: videoObjectId,
                        entityType: "Reel"
                    });

                }
            }

        } catch (e: any) {
            if (e.code === 11000) {
                
                return NextResponse.json({ success: true, alreadyLiked: true });
            }
            throw e;
        }

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
