import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import Follow from "@/models/Follow";
import Profile from "@/models/Profile";
import { connectToDatabase } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Get list of followed users
        const following = await Follow.find({ followerId: currentUser._id }).sort({ createdAt: -1 }).limit(50);

        if (!following || following.length === 0) {
            return NextResponse.json({ circle: [] });
        }

        const followingIds = following.map((f: any) => f.followingId);

        // Fetch User and Profile data for these users
        const circleUsers = await Promise.all(followingIds.map(async (userId: any) => {
            const user = await User.findById(userId).select('lastActive');
            const profile = await Profile.findOne({ userId }).select('displayName username avatarUrl');

            if (!user || !profile) return null;

            return {
                _id: userId.toString(),
                displayName: profile.displayName || "Unknown",
                username: profile.username || "unknown",
                avatarUrl: profile.avatarUrl,
                lastActive: user.lastActive,
            };
        }));

        // Filter nulls and sort by lastActive (Recent first)
        const validUsers = circleUsers
            .filter((u): u is NonNullable<typeof u> => u !== null)
            .sort((a, b) => {
                const timeA = new Date(a.lastActive || 0).getTime();
                const timeB = new Date(b.lastActive || 0).getTime();
                return timeB - timeA;
            });

        return NextResponse.json({ circle: validUsers });

    } catch (error) {
        console.error("Circle fetch error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
