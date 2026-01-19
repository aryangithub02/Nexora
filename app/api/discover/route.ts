import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Follow from "@/models/Follow";
import Profile from "@/models/Profile";
import Video from "@/models/Video";

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
        const mode = searchParams.get('mode') || 'trending';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '24');
        const skip = (page - 1) * limit;

        // Get users the current user already follows (to mark them as followed)
        const following = await Follow.find({ followerId: currentUser._id }).select('followingId');
        const followingIds = following.map(f => f.followingId.toString());

        let users: any[] = [];
        let total = 0;
        let seams: any[] = [];

        const activeThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 min for "recently online"

        if (mode === 'trending') {
            // Most followers overall - show all users except current user
            users = await User.find({
                _id: { $ne: currentUser._id },
                'privacy.appearInDiscover': { $ne: false }
            })
                .select('_id email followersCount followingCount lastActive createdAt')
                .sort({ followersCount: -1 })
                .skip(skip)
                .limit(limit);
            total = await User.countDocuments({
                _id: { $ne: currentUser._id },
                'privacy.appearInDiscover': { $ne: false }
            });

        } else if (mode === 'new') {
            // Newest creators (joined in last 30 days)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            users = await User.find({
                _id: { $ne: currentUser._id },
                createdAt: { $gte: thirtyDaysAgo },
                'privacy.appearInDiscover': { $ne: false }
            })
                .select('_id email followersCount followingCount lastActive createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            total = await User.countDocuments({
                _id: { $ne: currentUser._id },
                createdAt: { $gte: thirtyDaysAgo },
                'privacy.appearInDiscover': { $ne: false }
            });

        } else if (mode === 'active') {
            // Most recently active
            users = await User.find({
                _id: { $ne: currentUser._id },
                lastActive: { $gte: activeThreshold },
                'privacy.appearInDiscover': { $ne: false }
            })
                .select('_id email followersCount followingCount lastActive createdAt')
                .sort({ lastActive: -1 })
                .skip(skip)
                .limit(limit);
            total = await User.countDocuments({
                _id: { $ne: currentUser._id },
                lastActive: { $gte: activeThreshold },
                'privacy.appearInDiscover': { $ne: false }
            });

        } else if (mode === 'rising') {
            // Rising = new users with followers (gained traction quickly)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            users = await User.find({
                _id: { $ne: currentUser._id },
                createdAt: { $gte: sevenDaysAgo },
                followersCount: { $gte: 1 },
                'privacy.appearInDiscover': { $ne: false }
            })
                .select('_id email followersCount followingCount lastActive createdAt')
                .sort({ followersCount: -1 })
                .skip(skip)
                .limit(limit);
            total = await User.countDocuments({
                _id: { $ne: currentUser._id },
                createdAt: { $gte: sevenDaysAgo },
                followersCount: { $gte: 1 },
                'privacy.appearInDiscover': { $ne: false }
            });
        }

        // Get profiles for these users
        const userIds = users.map(u => u._id);
        const profiles = await Profile.find({ userId: { $in: userIds } })
            .select('userId displayName username bio avatarUrl');

        // Get latest video for each user (for preview)
        const latestVideos = await Video.aggregate([
            { $match: { 'uploadedBy._id': { $in: userIds } } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$uploadedBy._id',
                    videoUrl: { $first: '$videoUrl' },
                    thumbnailUrl: { $first: '$thumbnailUrl' }
                }
            }
        ]);

        // Build response with profiles
        const discoveredUsers = users.map(user => {
            const profile = profiles.find(p => p.userId?.toString() === user._id?.toString());
            const video = latestVideos.find(v => v._id?.toString() === user._id?.toString());
            const isRecentlyOnline = user.lastActive && new Date(user.lastActive) > activeThreshold;
            const isFollowing = followingIds.includes(user._id?.toString() || '');

            return {
                _id: user._id,
                email: user.email,
                displayName: profile?.displayName || user.email?.split('@')[0] || 'Creator',
                username: profile?.username,
                bio: profile?.bio || '',
                avatarUrl: profile?.avatarUrl,
                followersCount: user.followersCount || 0,
                followingCount: user.followingCount || 0,
                isRecentlyOnline,
                isFollowing,
                joinedAt: user.createdAt,
                lastActive: user.lastActive,
                previewVideoUrl: video?.videoUrl,
                previewThumbnailUrl: video?.thumbnailUrl
            };
        });

        // Generate discovery seams based on page
        if (page === 1) {
            seams = [
                { position: 6, type: 'insight', text: 'Rising voices this week' },
                { position: 15, type: 'insight', text: 'Most followed in the last 24 hours' }
            ];
        } else if (page === 2) {
            seams = [
                { position: 8, type: 'insight', text: 'Creators similar to those you follow' }
            ];
        }

        return NextResponse.json({
            users: discoveredUsers,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + users.length < total,
            seams,
            mode
        });

    } catch (error: any) {
        console.error("Discover error:", error);
        return NextResponse.json(
            { error: "Failed to discover users" },
            { status: 500 }
        );
    }
}
