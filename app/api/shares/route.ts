import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Share from "@/models/Share";
import Video from "@/models/Video";
import mongoose from "mongoose";

// GET - Get share count for a video
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get("videoId");

        if (!videoId) {
            return NextResponse.json({ error: "videoId is required" }, { status: 400 });
        }

        await connectToDatabase();

        const videoObjectId = new mongoose.Types.ObjectId(videoId);
        const shareCount = await Share.countDocuments({ videoId: videoObjectId });

        return NextResponse.json({
            shareCount,
        });
    } catch (error) {
        console.error("Error getting share count:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Record a share (outward projection)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { videoId, shareType, recipientId, externalPlatform } = await request.json();

        if (!videoId || !shareType) {
            return NextResponse.json({ error: "videoId and shareType are required" }, { status: 400 });
        }

        const validShareTypes = ['copy_link', 'send_user', 'external'];
        if (!validShareTypes.includes(shareType)) {
            return NextResponse.json({ error: "Invalid shareType" }, { status: 400 });
        }

        await connectToDatabase();

        const userId = new mongoose.Types.ObjectId((session.user as any).id);
        const videoObjectId = new mongoose.Types.ObjectId(videoId);

        // Check if video exists
        const video = await Video.findById(videoObjectId);
        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        // Create share record
        await Share.create({
            userId,
            videoId: videoObjectId,
            shareType,
            recipientId: recipientId ? new mongoose.Types.ObjectId(recipientId) : undefined,
            externalPlatform,
        });

        // Get updated share count
        const shareCount = await Share.countDocuments({ videoId: videoObjectId });

        return NextResponse.json({
            success: true,
            shareCount,
        });
    } catch (error) {
        console.error("Error recording share:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
