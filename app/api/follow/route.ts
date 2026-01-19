import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Follow from "@/models/Follow";
import User from "@/models/User";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { targetId } = await req.json();

        if (!targetId) {
            return NextResponse.json({ error: "Target ID required" }, { status: 400 });
        }

        await connectToDatabase();

        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (currentUser._id.toString() === targetId) {
            return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
        }

        // Blocking Check
        const { default: Blocked } = await import("@/models/Blocked");
        const isBlocked = await Blocked.exists({
            $or: [
                { blockerId: currentUser._id, blockedId: targetId },
                { blockerId: targetId, blockedId: currentUser._id }
            ]
        });

        if (isBlocked) {
            return NextResponse.json({ error: "Action not allowed" }, { status: 403 });
        }

        // Check target user's privacy settings
        const targetUser = await User.findById(targetId);
        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if already following
        const existingFollow = await Follow.findOne({
            followerId: currentUser._id,
            followingId: targetId
        });

        if (existingFollow) {
            return NextResponse.json({ status: "following" }, { status: 200 });
        }

        // Check privacy settings
        const requireApproval = targetUser.privacy?.requireFollowApproval ||
            (targetUser.privacy?.isPublic === false && targetUser.privacy?.requireFollowApproval !== false);

        if (requireApproval) {
            const { default: FollowRequest } = await import("@/models/FollowRequest");

            // Check for ANY existing request (pending, accepted, rejected)
            const existingRequest = await FollowRequest.findOne({
                requesterId: currentUser._id,
                recipientId: targetId
            });

            if (existingRequest) {
                if (existingRequest.status === 'pending') {
                    return NextResponse.json({ status: "requested" }, { status: 200 });
                }

                // If rejected or accepted (though accepted usually leads to Follow, maybe they unfollowed and want to request again)
                // We reset to pending
                existingRequest.status = 'pending';
                // Update createdAt to now so it shows at top
                existingRequest.createdAt = new Date(); // Need to ensure schema allows this or rely on timestamps
                await existingRequest.save();

                // Create notification for the re-request
                await Notification.create({
                    recipient: targetId,
                    actor: currentUser._id,
                    type: "follow_request",
                    entityType: "FollowRequest",
                    entityId: existingRequest._id
                });

                return NextResponse.json({ status: "requested" }, { status: 200 });
            }

            // Create new request
            const newRequest = await FollowRequest.create({
                requesterId: currentUser._id,
                recipientId: targetId,
                status: 'pending'
            });

            await Notification.create({
                recipient: targetId,
                actor: currentUser._id,
                type: "follow_request",
                entityType: "FollowRequest",
                entityId: newRequest._id
            });

            return NextResponse.json({ status: "requested" }, { status: 200 });
        }

        // Standard Follow
        try {
            await Follow.create({ followerId: currentUser._id, followingId: targetId });

            // Update counts
            await User.findByIdAndUpdate(currentUser._id, { $inc: { followingCount: 1 } });
            await User.findByIdAndUpdate(targetId, { $inc: { followersCount: 1 } });

            // Create Notification
            await Notification.create({
                recipient: targetId,
                actor: currentUser._id,
                type: "follow",
                entityType: "User",
                entityId: currentUser._id
            });

            return NextResponse.json({ status: "following" }, { status: 201 });

        } catch (error: any) {
            if (error.code === 11000) {
                return NextResponse.json({ status: "following" }, { status: 200 });
            }
            throw error;
        }

    } catch (error) {
        console.error("Error in follow POST:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { targetId } = await req.json();

        if (!targetId) {
            return NextResponse.json({ error: "Target ID required" }, { status: 400 });
        }

        await connectToDatabase();

        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Try to delete active follow
        const deletedFollow = await Follow.findOneAndDelete({
            followerId: currentUser._id,
            followingId: targetId
        });

        if (deletedFollow) {
            await User.findByIdAndUpdate(currentUser._id, { $inc: { followingCount: -1 } });
            await User.findByIdAndUpdate(targetId, { $inc: { followersCount: -1 } });
            return NextResponse.json({ message: "Unfollowed successfully", status: "not_following" }, { status: 200 });
        }

        // Try to delete pending request
        const { default: FollowRequest } = await import("@/models/FollowRequest");
        const deletedRequest = await FollowRequest.findOneAndDelete({
            requesterId: currentUser._id,
            recipientId: targetId,
            status: 'pending'
        });

        if (deletedRequest) {
            return NextResponse.json({ message: "Request cancelled", status: "not_following" }, { status: 200 });
        }

        return NextResponse.json({ message: "Not following or requested" }, { status: 200 });

    } catch (error) {
        console.error("Error in follow DELETE:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ isFollowing: false }); // Or 401, but boolean is easier for UI
        }

        const { searchParams } = new URL(req.url);
        const targetId = searchParams.get("targetId");

        if (!targetId) {
            return NextResponse.json({ error: "Target ID required" }, { status: 400 });
        }

        await connectToDatabase();
        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser) {
            return NextResponse.json({ isFollowing: false });
        }

        const follow = await Follow.findOne({
            followerId: currentUser._id,
            followingId: targetId
        });

        return NextResponse.json({ isFollowing: !!follow }, { status: 200 });

    } catch (error) {
        console.error("Error in follow GET:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
