import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Follow from "@/models/Follow";
import Profile from "@/models/Profile";

// Get followers or following list
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

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || 'following'; // 'followers' | 'following' | 'discover'
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        let users: any[] = [];
        let total = 0;

        if (type === 'following') {
            // Get users the current user follows
            const follows = await Follow.find({ followerId: currentUser._id })
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });

            total = await Follow.countDocuments({ followerId: currentUser._id });

            const userIds = follows.map(f => f.followingId);
            const usersData = await User.find({ _id: { $in: userIds } })
                .select('_id email followersCount followingCount lastActive');

            const profiles = await Profile.find({ userId: { $in: userIds } })
                .select('userId displayName username bio avatarUrl');

            users = usersData.map(user => {
                const profile = profiles.find(p => p.userId?.toString() === user._id?.toString());
                const follow = follows.find(f => f.followingId.toString() === user._id?.toString());
                return {
                    _id: user._id,
                    email: user.email,
                    displayName: profile?.displayName || user.email?.split('@')[0],
                    username: profile?.username,
                    bio: profile?.bio,
                    avatarUrl: profile?.avatarUrl,
                    followersCount: user.followersCount || 0,
                    followingCount: user.followingCount || 0,
                    followedAt: follow?.createdAt,
                    isOnline: user.lastActive && new Date(user.lastActive) > new Date(Date.now() - 5 * 60 * 1000)
                };
            });

        } else if (type === 'followers') {
            // Get users who follow the current user
            const follows = await Follow.find({ followingId: currentUser._id })
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });

            total = await Follow.countDocuments({ followingId: currentUser._id });

            const userIds = follows.map(f => f.followerId);
            const usersData = await User.find({ _id: { $in: userIds } })
                .select('_id email followersCount followingCount lastActive');

            const profiles = await Profile.find({ userId: { $in: userIds } })
                .select('userId displayName username bio avatarUrl');

            // Check if current user follows them back
            const followBacks = await Follow.find({
                followerId: currentUser._id,
                followingId: { $in: userIds }
            });
            const followBackIds = new Set(followBacks.map(f => f.followingId.toString()));

            users = usersData.map(user => {
                const profile = profiles.find(p => p.userId?.toString() === user._id?.toString());
                const follow = follows.find(f => f.followerId.toString() === user._id?.toString());
                return {
                    _id: user._id,
                    email: user.email,
                    displayName: profile?.displayName || user.email?.split('@')[0],
                    username: profile?.username,
                    bio: profile?.bio,
                    avatarUrl: profile?.avatarUrl,
                    followersCount: user.followersCount || 0,
                    followingCount: user.followingCount || 0,
                    followedAt: follow?.createdAt,
                    isFollowingBack: followBackIds.has(user._id?.toString() || ''),
                    isOnline: user.lastActive && new Date(user.lastActive) > new Date(Date.now() - 5 * 60 * 1000)
                };
            });

        } else if (type === 'discover') {
            // Get users the current user doesn't follow
            const following = await Follow.find({ followerId: currentUser._id }).select('followingId');
            const followingIds = following.map(f => f.followingId);

            const allUsers = await User.find({
                _id: { $nin: [...followingIds, currentUser._id] }
            })
                .select('_id email followersCount followingCount lastActive')
                .skip(skip)
                .limit(limit)
                .sort({ followersCount: -1 }); // Sort by popularity

            total = await User.countDocuments({
                _id: { $nin: [...followingIds, currentUser._id] }
            });

            const userIds = allUsers.map(u => u._id);
            const profiles = await Profile.find({ userId: { $in: userIds } })
                .select('userId displayName username bio avatarUrl');

            users = allUsers.map(user => {
                const profile = profiles.find(p => p.userId?.toString() === user._id?.toString());
                return {
                    _id: user._id,
                    email: user.email,
                    displayName: profile?.displayName || user.email?.split('@')[0],
                    username: profile?.username,
                    bio: profile?.bio,
                    avatarUrl: profile?.avatarUrl,
                    followersCount: user.followersCount || 0,
                    followingCount: user.followingCount || 0,
                    isOnline: user.lastActive && new Date(user.lastActive) > new Date(Date.now() - 5 * 60 * 1000)
                };
            });
        }

        return NextResponse.json({
            users,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + users.length < total
        });

    } catch (error: any) {
        console.error("Network error:", error);
        return NextResponse.json(
            { error: "Failed to fetch network" },
            { status: 500 }
        );
    }
}
