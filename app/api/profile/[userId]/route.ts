import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Profile from "@/models/Profile";
import User from "@/models/User";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await connectToDatabase();

        const { userId } = await params;

        if (!userId) {
            return NextResponse.json(
                { error: "User ID required" },
                { status: 400 }
            );
        }

        const session = await getServerSession(authOptions);
        if (session?.user?.email) {
            const currentUser = await User.findOne({ email: session.user.email }).select('_id');
            if (currentUser && currentUser._id.toString() !== userId) {
                const { default: Blocked } = await import("@/models/Blocked");
                
                if (mongoose.Types.ObjectId.isValid(userId)) {
                    const isBlocked = await Blocked.exists({
                        $or: [
                            { blockerId: currentUser._id, blockedId: userId },
                            { blockerId: userId, blockedId: currentUser._id }
                        ]
                    });
                    if (isBlocked) {
                        return NextResponse.json({ error: "User not found" }, { status: 404 }); 
                    }
                }
            }
        }

        let profile = null;

        if (mongoose.Types.ObjectId.isValid(userId)) {
            profile = await Profile.findOne({
                userId: new mongoose.Types.ObjectId(userId)
            }).select('displayName username bio avatarUrl bannerUrl themeAccent');
        }

        if (!profile) {
            profile = await Profile.findOne({
                userId: userId
            }).select('displayName username bio avatarUrl bannerUrl themeAccent');
        }

        if (!profile) {
            
            return NextResponse.json({
                profile: null
            });
        }

        const user = await User.findById(profile.userId).select('privacy followersCount followingCount');

        return NextResponse.json({
            profile: {
                displayName: profile.displayName,
                username: profile.username,
                bio: profile.bio,
                avatarUrl: profile.avatarUrl,
                bannerUrl: profile.bannerUrl,
                themeAccent: profile.themeAccent,
                
                privacy: user?.privacy,
                followersCount: user?.followersCount || 0,
                followingCount: user?.followingCount || 0
            }
        });

    } catch (error: any) {
        console.error("Error fetching profile:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}
