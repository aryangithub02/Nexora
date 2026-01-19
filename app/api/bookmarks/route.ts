import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Bookmark from "@/models/Bookmark";
import Video from "@/models/Video";
import mongoose from "mongoose";

// GET - Check if user bookmarked a video or get user's bookmarks
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get("videoId");
        const getAll = searchParams.get("all") === "true";
        const sortBy = searchParams.get("sortBy") || "memory"; // 'memory' or 'recent'

        await connectToDatabase();

        const userId = new mongoose.Types.ObjectId((session.user as any).id);

        // If videoId is provided, check bookmark status
        if (videoId) {
            const videoObjectId = new mongoose.Types.ObjectId(videoId);
            const bookmark = await Bookmark.findOne({ userId, videoId: videoObjectId });

            return NextResponse.json({
                isBookmarked: !!bookmark,
            });
        }

        // If getAll is true, return all bookmarks
        if (getAll) {
            const sortOption = sortBy === "memory"
                ? { revisitCount: -1 as const, lastVisitedAt: -1 as const }
                : { lastVisitedAt: -1 as const };

            const bookmarks = await Bookmark.find({ userId })
                .sort(sortOption as any)
                .populate({
                    path: 'videoId',
                    model: Video,
                })
                .lean();

            return NextResponse.json({
                bookmarks,
            });
        }

        return NextResponse.json({ error: "videoId or all parameter required" }, { status: 400 });
    } catch (error) {
        console.error("Error checking bookmark status:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Bookmark a video (memory act)
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

        // Try to create bookmark (will fail if already exists)
        try {
            await Bookmark.create({
                userId,
                videoId: videoObjectId,
                revisitCount: 0,
                lastVisitedAt: new Date(),
            });
        } catch (e: any) {
            if (e.code === 11000) {
                // Already bookmarked - increment revisit count
                await Bookmark.updateOne(
                    { userId, videoId: videoObjectId },
                    {
                        $inc: { revisitCount: 1 },
                        $set: { lastVisitedAt: new Date() }
                    }
                );
                return NextResponse.json({ success: true, revisited: true });
            }
            throw e;
        }

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error("Error bookmarking video:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Remove bookmark
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

        await Bookmark.deleteOne({ userId, videoId: videoObjectId });

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error("Error removing bookmark:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
