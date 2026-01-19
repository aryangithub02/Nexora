import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import FollowRequest from "@/models/FollowRequest";
import Follow from "@/models/Follow";
import User from "@/models/User";
import Notification from "@/models/Notification";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { requestId } = await req.json();
        console.log("Approving request ID:", requestId, "for user:", session.user.email);

        if (!requestId) {
            return NextResponse.json({ error: "Request ID required" }, { status: 400 });
        }

        await connectToDatabase();

        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser) {
            console.error("Approving user not found in DB");
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let request = await FollowRequest.findOne({
            _id: requestId,
            recipientId: currentUser._id,
            status: 'pending'
        });

        // Fallback: requestId might actually be a requesterId (due to previous bug in notification creation)
        if (!request) {
            console.log("Request not found by ID, trying as requesterId:", requestId);
            request = await FollowRequest.findOne({
                requesterId: requestId,
                recipientId: currentUser._id,
                status: 'pending'
            });
        }

        if (!request) {
            console.error("Follow request not found or not pending. ID/Requester:", requestId, "Recipient:", currentUser._id);
            return NextResponse.json({ error: "Request not found or already processed" }, { status: 404 });
        }

        console.log("Found request:", request._id, "Current Status:", request.status);

        // Execute Approval Transaction

        // 2. Create Follow
        try {
            await Follow.create({
                followerId: request.requesterId,
                followingId: currentUser._id
            });
            console.log("Follow relationship created");

            // 3. Update Counts
            await User.findByIdAndUpdate(request.requesterId, { $inc: { followingCount: 1 } });
            await User.findByIdAndUpdate(currentUser._id, { $inc: { followersCount: 1 } });
            console.log("User counts updated");

            // 4. Notify Requester
            await Notification.create({
                recipient: request.requesterId,
                actor: currentUser._id,
                type: "follow_accepted",
                entityType: "User",
                entityId: currentUser._id
            });
            console.log("Notification sent");

            // 1. Delete Request (Moved to end to ensure follow creation succeeds first)
            await FollowRequest.findByIdAndDelete(requestId);
            console.log("Request deleted");

        } catch (e: any) {
            if (e.code === 11000) {
                console.log("Already following (duplicate key), deleting request anyway...");
                await FollowRequest.findByIdAndDelete(requestId);
            } else {
                console.error("Error creating follow/notification:", e);
                throw e; // Propagate error if it's not a duplicate key
            }
        }

        return NextResponse.json({ message: "Request approved" }, { status: 200 });

    } catch (error) {
        console.error("Error approving follow request:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
