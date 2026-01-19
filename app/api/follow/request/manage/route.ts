import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import FollowRequest from "@/models/FollowRequest";
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

        const { requestId, action } = await req.json();

        if (!requestId || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
        }

        await connectToDatabase();

        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const request = await FollowRequest.findById(requestId);
        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        // Verify ownership (only the recipient can approve/reject)
        if (request.recipientId.toString() !== currentUser._id.toString()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Transactional Session (optional but safer, Mongoose supports it if Replica Set)
        // For simplicity in this env, we'll do sequential operations with simple error handling.
        // If critical production, use session.

        const sessionMongoose = await mongoose.startSession();

        try {
            await sessionMongoose.withTransaction(async () => {
                if (action === 'approve') {
                    // 1. Create Follow
                    // Check duplicate just in case
                    const existing = await Follow.findOne({
                        followerId: request.requesterId,
                        followingId: request.recipientId
                    }).session(sessionMongoose);

                    if (!existing) {
                        await Follow.create([{
                            followerId: request.requesterId,
                            followingId: request.recipientId
                        }], { session: sessionMongoose });

                        // 2. Update Counts
                        await User.findByIdAndUpdate(request.requesterId, { $inc: { followingCount: 1 } }).session(sessionMongoose);
                        await User.findByIdAndUpdate(request.recipientId, { $inc: { followersCount: 1 } }).session(sessionMongoose);

                        // 3. Notify Requester
                        await Notification.create([{
                            recipient: request.requesterId,
                            actor: currentUser._id,
                            type: 'follow_accepted',
                            entityType: 'User',
                            entityId: currentUser._id
                        }], { session: sessionMongoose });
                    }
                }

                // 4. Delete Request (Approve or Reject)
                await FollowRequest.findByIdAndDelete(requestId).session(sessionMongoose);

                // 5. Clean up the original notification (optional, but good for UI hygiene)
                // We need to find the notification linking to this request, OR just the follow_request type from this actor to this recipient
                await Notification.deleteMany({
                    recipient: currentUser._id,
                    type: 'follow_request',
                    actor: request.requesterId
                }).session(sessionMongoose);
            });

            sessionMongoose.endSession();
            return NextResponse.json({ status: "success" });

        } catch (error) {
            sessionMongoose.endSession();
            throw error;
        }

    } catch (error) {
        console.error("Error managing follow request:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
