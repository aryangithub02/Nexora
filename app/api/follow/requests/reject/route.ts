import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import FollowRequest from "@/models/FollowRequest";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { requestId } = await req.json();

        if (!requestId) {
            return NextResponse.json({ error: "Request ID required" }, { status: 400 });
        }

        await connectToDatabase();

        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let request = await FollowRequest.findOne({
            _id: requestId,
            recipientId: currentUser._id,
            status: 'pending'
        });

        if (!request) {
            
            request = await FollowRequest.findOne({
                requesterId: requestId,
                recipientId: currentUser._id,
                status: 'pending'
            });
        }

        if (!request) {
            
            const deleted = await FollowRequest.findByIdAndDelete(requestId);
            if (!deleted) {
                
                await FollowRequest.findOneAndDelete({
                    requesterId: requestId,
                    recipientId: currentUser._id,
                    status: 'pending'
                });
            }
            return NextResponse.json({ message: "Request rejected" }, { status: 200 }); 
        }

        await FollowRequest.findByIdAndDelete(request._id);

        return NextResponse.json({ message: "Request rejected" }, { status: 200 });

    } catch (error) {
        console.error("Error rejecting follow request:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
