import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Follow from "@/models/Follow";
import Profile from "@/models/Profile";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Get list of users already followed
        const following = await Follow.find({ followerId: currentUser._id }).select("followingId");
        const followingIds = following.map(f => f.followingId);

        // Find users to suggest
        // Criteria: Not me, Not already followed, Allow Suggestions
        const suggestions = await User.find({
            _id: { $nin: [...followingIds, currentUser._id] },
            'privacy.allowSuggestions': { $ne: false } // Default true, so check for not false
        })
            .sort({ followersCount: -1, lastActive: -1 }) // Popular and active
            .limit(10)
            .select("_id email followersCount");

        // Fetch profiles
        const userIds = suggestions.map(u => u._id);
        const profiles = await Profile.find({ userId: { $in: userIds } })
            .select("userId displayName username avatarUrl bio");

        // Merge data
        const enrichedSuggestions = suggestions.map(user => {
            const profile = profiles.find(p => p.userId.toString() === user._id.toString());
            return {
                _id: user._id,
                displayName: profile?.displayName || user.email.split('@')[0],
                username: profile?.username,
                avatarUrl: profile?.avatarUrl,
                bio: profile?.bio,
                followersCount: user.followersCount
            };
        });

        return NextResponse.json(enrichedSuggestions);

    } catch (error) {
        console.error("Error fetching suggestions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
