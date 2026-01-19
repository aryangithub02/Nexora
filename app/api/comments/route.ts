import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Comment from "@/models/Comment";
import Profile from "@/models/Profile";
import Video from "@/models/Video";
import User from "@/models/User";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

// GET - Get comments for a video (newest first)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get("videoId");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = parseInt(searchParams.get("skip") || "0");

        if (!videoId) {
            return NextResponse.json({ error: "videoId is required" }, { status: 400 });
        }

        await connectToDatabase();

        const videoObjectId = new mongoose.Types.ObjectId(videoId);

        // Get comments with user info
        const comments = await Comment.find({ videoId: videoObjectId })
            .sort({ createdAt: -1 }) // Newest first
            .skip(skip)
            .limit(limit)
            .lean();

        // Get total count
        const totalCount = await Comment.countDocuments({ videoId: videoObjectId });

        // Fetch user profiles for comments
        const userIds = [...new Set(comments.map(c => c.userId.toString()))];
        const profiles = await Profile.find({ userId: { $in: userIds } }).lean();
        const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

        const currentUserId = session?.user ? (session.user as any).id : null;

        // Enrich comments with user data
        const enrichedComments = comments.map(comment => {
            const profile = profileMap.get(comment.userId.toString());
            return {
                ...comment,
                user: profile ? {
                    _id: comment.userId,
                    displayName: profile.displayName,
                    username: profile.username,
                    avatarUrl: profile.avatarUrl,
                } : {
                    _id: comment.userId,
                    displayName: 'Unknown User',
                },
                likeCount: comment.likes?.length || 0,
                isLiked: currentUserId && comment.likes ? comment.likes.map((id: any) => id.toString()).includes(currentUserId) : false,
                parentId: comment.parentId || null,
                isDeleted: comment.isDeleted || false,
                deletedBy: comment.deletedBy || null
            };
        });

        return NextResponse.json({
            comments: enrichedComments,
            totalCount,
            hasMore: skip + comments.length < totalCount,
        });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create a new comment (conversational gravity)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { videoId, text, parentId } = await request.json();

        if (!videoId || !text?.trim()) {
            return NextResponse.json({ error: "videoId and text are required" }, { status: 400 });
        }

        if (text.length > 1000) {
            return NextResponse.json({ error: "Comment too long (max 1000 characters)" }, { status: 400 });
        }

        await connectToDatabase();

        const userId = new mongoose.Types.ObjectId((session.user as any).id);
        const videoObjectId = new mongoose.Types.ObjectId(videoId);

        // Fetch user profile early for response and notifications
        const profile = await Profile.findOne({ userId }).lean();

        // Check if video exists
        const video = await Video.findById(videoObjectId);
        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        // Privacy Check: Comments
        const videoOwnerId = video.uploadedBy?._id || video.uploadedBy; // Depending on populate
        const videoOwner = await User.findById(videoOwnerId);

        if (videoOwner) {
            // Blocking Check
            if (videoOwnerId.toString() !== userId.toString()) {
                const { default: Blocked } = await import("@/models/Blocked");
                const isBlocked = await Blocked.exists({
                    $or: [
                        { blockerId: userId, blockedId: videoOwnerId }, // I blocked them
                        { blockerId: videoOwnerId, blockedId: userId }  // They blocked me
                    ]
                });
                if (isBlocked) {
                    return NextResponse.json({ error: "Action not allowed" }, { status: 403 });
                }
            }

            const commentPermission = videoOwner.privacy?.commentPermission || 'everyone';

            if (commentPermission === 'no_one') {
                if (videoOwnerId.toString() !== userId.toString()) {
                    return NextResponse.json({ error: "Comments are disabled for this video" }, { status: 403 });
                }
            } else if (commentPermission === 'followers') {
                if (videoOwnerId.toString() !== userId.toString()) {
                    const { default: Follow } = await import("@/models/Follow");
                    const isFollowing = await Follow.exists({ followerId: userId, followingId: videoOwnerId });
                    if (!isFollowing) {
                        return NextResponse.json({ error: "Only followers can comment" }, { status: 403 });
                    }
                }
            }
        }

        // Create comment
        const comment = await Comment.create({
            userId,
            videoId: videoObjectId,
            text: text.trim(),
            parentId: typeof parentId === 'string' ? new mongoose.Types.ObjectId(parentId) : null,
            likes: [],
        });

        // Create Notification (Comment on Reel)
        if (video.uploadedBy && videoOwnerId.toString() !== userId.toString()) {
            const notification = await Notification.create({
                recipient: videoOwnerId,
                actor: userId,
                type: "comment",
                entityId: videoObjectId,
                entityType: "Reel",
                text: text.trim().substring(0, 50)
            });

            // Real-time Emit

        }

        // Handle Mentions
        const mentionMatches = text.match(/@(\w+)/g);
        if (mentionMatches) {
            const usernames = mentionMatches.map((m: string) => m.substring(1)); // remove @
            const mentionedProfiles = await Profile.find({ username: { $in: usernames } });

            const mentionNotifications = [];

            for (const p of mentionedProfiles) {
                if (p.userId.toString() === userId.toString()) continue;

                // Privacy Check: Mentions
                const mentionedUser = await User.findById(p.userId);
                if (mentionedUser) {
                    const mentionPermission = mentionedUser.privacy?.mentionPermission || 'everyone';

                    if (mentionPermission === 'followers') {
                        const { default: Follow } = await import("@/models/Follow");
                        const isFollowing = await Follow.exists({ followerId: userId, followingId: p.userId });
                        if (!isFollowing) continue; // Skip notification
                    }
                }

                mentionNotifications.push({
                    recipient: p.userId,
                    actor: userId,
                    type: "mention",
                    entityId: videoObjectId,
                    entityType: "Reel",
                    text: text.trim().substring(0, 50)
                });
            }

            if (mentionNotifications.length > 0) {
                const insertedNotes = await Notification.insertMany(mentionNotifications);
                // Real-time Emit (Batch)

            }
        }

        // Profile already fetched above

        const enrichedComment = {
            ...comment.toObject(),
            user: profile ? {
                _id: userId,
                displayName: profile.displayName,
                username: profile.username,
                avatarUrl: profile.avatarUrl,
            } : {
                _id: userId,
                displayName: session.user.email?.split('@')[0] || 'User',
            },
            likeCount: 0,
            isLiked: false,
            parentId: comment.parentId
        };

        // Get updated comment count
        const totalCount = await Comment.countDocuments({ videoId: videoObjectId });

        return NextResponse.json({
            success: true,
            comment: enrichedComment,
            totalCount,
        });
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Delete a comment
export async function DELETE(request: NextRequest) {
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

        // Check permissions
        const comment = await Comment.findById(commentObjectId);
        if (!comment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        const video = await Video.findById(comment.videoId);
        const isVideoOwner = video && video.uploadedBy.toString() === userId.toString();
        const isCommentOwner = comment.userId.toString() === userId.toString();

        if (!isVideoOwner && !isCommentOwner) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Determine Delete Strategy
        const hasChildren = await Comment.exists({ parentId: commentObjectId });

        if (isVideoOwner && !isCommentOwner) {
            // Moderation: Soft Delete
            await Comment.findByIdAndUpdate(commentObjectId, {
                isDeleted: true,
                deletedBy: userId,
                text: "[removed]"
            });
        } else {
            // Self Delete
            if (hasChildren) {
                // Soft delete to preserve tree
                await Comment.findByIdAndUpdate(commentObjectId, {
                    isDeleted: true,
                    deletedBy: userId,
                    text: "[deleted]"
                });
            } else {
                // Hard delete
                await Comment.findByIdAndDelete(commentObjectId);
            }
        }

        // Get updated comment count
        const totalCount = await Comment.countDocuments({ videoId: comment.videoId, isDeleted: false });

        return NextResponse.json({
            success: true,
            totalCount,
        });
    } catch (error) {
        console.error("Error deleting comment:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
