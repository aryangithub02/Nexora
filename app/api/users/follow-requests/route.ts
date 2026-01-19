import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import FollowRequest from "@/models/FollowRequest";
import Follow from "@/models/Follow";
import User from "@/models/User";
import Notification from "@/models/Notification";

// GET: List pending follow requests
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const requests = await FollowRequest.find({
            recipientId: currentUser._id,
            status: "pending"
        })
            .populate("requesterId", "name email image _id username") // Assuming User has these fields
            .sort({ createdAt: -1 });

        return NextResponse.json(requests);

    } catch (error) {
        console.error("Error fetching follow requests:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Accept or Reject a request
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { requestId, action } = await req.json(); // action: "accept" | "reject"

        if (!requestId || !["accept", "reject"].includes(action)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        await connectToDatabase();
        const currentUser = await User.findOne({ email: session.user.email });

        const request = await FollowRequest.findOne({
            _id: requestId,
            recipientId: currentUser._id,
            status: "pending"
        });

        if (!request) {
            return NextResponse.json({ error: "Request not found or already handled" }, { status: 404 });
        }

        if (action === "accept") {
            // Create Follow
            await Follow.create({
                followerId: request.requesterId,
                followingId: currentUser._id
            });

            // Update request status
            request.status = "accepted"; // Or delete it? Model says 'rejected' but maybe accepted requests are deleted? 
            // Plan said: "User A accepts request -> Verify Follow record created, FollowRequest deleted/updated."
            // Let's delete it to keep DB clean, or marking it as accepted requires enum update.
            // Model has status: 'pending' | 'rejected'. So we should delete or add 'accepted'.
            // Deleting is cleaner for "pending list".
            await FollowRequest.findByIdAndDelete(requestId);

            // Update counts
            await User.findByIdAndUpdate(request.requesterId, { $inc: { followingCount: 1 } });
            await User.findByIdAndUpdate(currentUser._id, { $inc: { followersCount: 1 } });

            // Notify requester
            await Notification.create({
                recipient: request.requesterId,
                actor: currentUser._id,
                type: "follow_accept", // Ensure enum support
                entityType: "User",
                entityId: currentUser._id
            });
        } else {
            // Reject
            // We can mark as rejected or delete. 
            request.status = "rejected";
            await request.save();
            // Or delete? If rejected, they can request again?
            // Usually specific cooldown or just "Delete" so they can try again later?
            // Let's stick to updating status to blocked/rejected if we want to prevent spam.
            // But for now, updating status to rejected is fine.
        }

        return NextResponse.json({ message: `Request ${action}ed` });

    } catch (error) {
        console.error("Error handling follow request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
