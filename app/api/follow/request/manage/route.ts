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

        if (request.recipientId.toString() !== currentUser._id.toString()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const sessionMongoose = await mongoose.startSession();

        try {
            await sessionMongoose.withTransaction(async () => {
                if (action === 'approve') {

                    const existing = await Follow.findOne({
                        followerId: request.requesterId,
                        followingId: request.recipientId
                    }).session(sessionMongoose);

                    if (!existing) {
                        await Follow.create([{
                            followerId: request.requesterId,
                            followingId: request.recipientId
                        }], { session: sessionMongoose });

                        await User.findByIdAndUpdate(request.requesterId, { $inc: { followingCount: 1 } }).session(sessionMongoose);
                        await User.findByIdAndUpdate(request.recipientId, { $inc: { followersCount: 1 } }).session(sessionMongoose);

                        await Notification.create([{
                            recipient: request.requesterId,
                            actor: currentUser._id,
                            type: 'follow_accepted',
                            entityType: 'User',
                            entityId: currentUser._id
                        }], { session: sessionMongoose });
                    }
                }

                await FollowRequest.findByIdAndDelete(requestId).session(sessionMongoose);

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
