import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

export async function POST(req: NextRequest) {
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

        const { activity } = await req.json();

        // Update user's last active time and current activity
        await User.findByIdAndUpdate(currentUser._id, {
            lastActive: new Date(),
            currentActivity: activity || { type: 'idle', timestamp: new Date() }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Activity update error:", error);
        return NextResponse.json(
            { error: "Failed to update activity" },
            { status: 500 }
        );
    }
}
