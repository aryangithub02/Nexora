import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import FollowRequest from "@/models/FollowRequest";
import User from "@/models/User";
import Profile from "@/models/Profile";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const requests = await FollowRequest.find({
            recipientId: currentUser._id,
            status: 'pending'
        })
            .sort({ createdAt: -1 })
            .populate('requesterId', 'username email'); // Basic user info

        // We also need profile info (avatar, display name)
        // Since populate might not get profile (it's a separate model), we fetch profiles manually or via aggregation
        // Simple approach: fetch profiles for these users

        const requesterIds = requests.map(r => r.requesterId._id);
        const profiles = await Profile.find({ userId: { $in: requesterIds } })
            .select('userId displayName avatarUrl');

        const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

        const enrichedRequests = requests
            .filter(req => req.requesterId) // Filter out null requesters (deleted users)
            .map(req => {
                const profile = profileMap.get(req.requesterId._id.toString());
                return {
                    _id: req._id,
                    requester: {
                        _id: req.requesterId._id,
                        username: req.requesterId.username,
                        displayName: profile?.displayName || req.requesterId.username || "User",
                        avatarUrl: profile?.avatarUrl
                    },
                    createdAt: req.createdAt
                };
            });

        return NextResponse.json({ requests: enrichedRequests }, { status: 200 });

    } catch (error) {
        console.error("Error fetching follow requests:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
