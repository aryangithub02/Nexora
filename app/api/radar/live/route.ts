import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Follow from "@/models/Follow";
import Profile from "@/models/Profile";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const activeThreshold = new Date(Date.now() - 60 * 1000);

        const following = await Follow.find({ followerId: currentUser._id }).select('followingId');
        const followingIds = following.map(f => f.followingId);

        let activeUsers = await User.find({
            _id: { $in: followingIds },
            lastActive: { $gte: activeThreshold }
        }).select('_id email currentActivity lastActive').limit(20);

        if (activeUsers.length < 10) {
            const excludeIds = [...activeUsers.map(u => u._id), currentUser._id];

            const randomActive = await User.find({
                _id: { $nin: excludeIds },
                lastActive: { $gte: activeThreshold }
            })
                .select('_id email currentActivity lastActive')
                .sort({ lastActive: -1 }) 
                .limit(10 - activeUsers.length); 

            activeUsers = [...activeUsers, ...randomActive];
        }

        const userIds = activeUsers.map(u => u._id);
        const profiles = await Profile.find({ userId: { $in: userIds } }).select('userId displayName username avatarUrl');

        const liveUsers = activeUsers.map(user => {
            const profile = profiles.find(p => p.userId?.toString() === user._id?.toString());
            return {
                _id: user._id,
                email: user.email,
                displayName: profile?.displayName || user.email?.split('@')[0] || 'Unknown',
                username: profile?.username,
                avatarUrl: profile?.avatarUrl,
                currentActivity: user.currentActivity || { type: 'idle' },
                lastActive: user.lastActive,
                isActive: user.currentActivity?.type === 'watching'
            };
        });

        return NextResponse.json({
            users: liveUsers,
            count: liveUsers.length
        });

    } catch (error: any) {
        console.error("Live radar error:", error);
        return NextResponse.json(
            { error: "Failed to fetch live users" },
            { status: 500 }
        );
    }
}
