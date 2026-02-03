import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Bookmark from "@/models/Bookmark";
import Video from "@/models/Video";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get("videoId");
        const getAll = searchParams.get("all") === "true";
        const sortBy = searchParams.get("sortBy") || "memory"; 

        await connectToDatabase();

        const userId = new mongoose.Types.ObjectId((session.user as any).id);

        if (videoId) {
            const videoObjectId = new mongoose.Types.ObjectId(videoId);
            const bookmark = await Bookmark.findOne({ userId, videoId: videoObjectId });

            return NextResponse.json({
                isBookmarked: !!bookmark,
            });
        }

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
            await Bookmark.create({
                userId,
                videoId: videoObjectId,
                revisitCount: 0,
                lastVisitedAt: new Date(),
            });
        } catch (e: any) {
            if (e.code === 11000) {
                
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
