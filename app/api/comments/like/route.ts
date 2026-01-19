import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Comment from "@/models/Comment";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { commentId } = await request.json();
        if (!commentId) {
            return NextResponse.json({ error: "commentId is required" }, { status: 400 });
        }

        await connectToDatabase();
        const userId = new mongoose.Types.ObjectId((session.user as any).id);
        const commentObjectId = new mongoose.Types.ObjectId(commentId);

        const comment = await Comment.findById(commentObjectId);
        if (!comment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        const isLiked = comment.likes && comment.likes.includes(userId);

        if (isLiked) {
            // Unlike
            await Comment.findByIdAndUpdate(commentObjectId, {
                $pull: { likes: userId }
            });
        } else {
            // Like
            await Comment.findByIdAndUpdate(commentObjectId, {
                $addToSet: { likes: userId }
            });

            // Notify comment owner
            if (comment.userId.toString() !== userId.toString()) {
                await Notification.create({
                    recipient: comment.userId,
                    actor: userId,
                    type: "like",
                    entityId: comment.videoId,
                    entityType: "Reel",
                    text: `liked your comment: "${comment.text.substring(0, 20)}${comment.text.length > 20 ? '...' : ''}"`
                });
            }
        }

        // Get updated count
        const updatedComment = await Comment.findById(commentObjectId);

        return NextResponse.json({
            success: true,
            isLiked: !isLiked,
            likeCount: updatedComment.likes ? updatedComment.likes.length : 0
        });

    } catch (error) {
        console.error("Error toggling comment like:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
