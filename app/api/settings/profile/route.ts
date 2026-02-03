import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Profile from "@/models/Profile";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId") || session.user.id;

        const profile = await Profile.findOne({ userId });

        if (!profile) {
            return NextResponse.json({ profile: null }, { status: 200 }); 
        }

        return NextResponse.json({ profile }, { status: 200 });

    } catch (error) {
        console.error("Failed to fetch profile:", error);
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { displayName, username, bio, avatarUrl, bannerUrl, themeAccent } = body;

        if (!username) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 });
        }

        await connectToDatabase();

        const existingProfile = await Profile.findOne({ username });
        if (existingProfile && existingProfile.userId.toString() !== session.user.id) {
            return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
        }

        const profile = await Profile.findOneAndUpdate(
            { userId: session.user.id },
            {
                userId: session.user.id,
                displayName,
                username,
                bio,
                avatarUrl,
                bannerUrl,
                themeAccent
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return NextResponse.json({ profile }, { status: 200 });

    } catch (error) {
        console.error("Failed to update profile:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
