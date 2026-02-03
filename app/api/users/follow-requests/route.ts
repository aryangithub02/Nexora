import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import FollowRequest from "@/models/FollowRequest";
import Follow from "@/models/Follow";
import User from "@/models/User";
import Notification from "@/models/Notification";

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
            .populate("requesterId", "name email image _id username") 
            .sort({ createdAt: -1 });

        return NextResponse.json(requests);

    } catch (error) {
        console.error("Error fetching follow requests:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { requestId, action } = await req.json(); 

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
            
            await Follow.create({
                followerId: request.requesterId,
                followingId: currentUser._id
            });

            request.status = "accepted"; 

            await FollowRequest.findByIdAndDelete(requestId);

            await User.findByIdAndUpdate(request.requesterId, { $inc: { followingCount: 1 } });
            await User.findByIdAndUpdate(currentUser._id, { $inc: { followersCount: 1 } });

            await Notification.create({
                recipient: request.requesterId,
                actor: currentUser._id,
                type: "follow_accept", 
                entityType: "User",
                entityId: currentUser._id
            });
        } else {

            request.status = "rejected";
            await request.save();

        }

        return NextResponse.json({ message: `Request ${action}ed` });

    } catch (error) {
        console.error("Error handling follow request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
