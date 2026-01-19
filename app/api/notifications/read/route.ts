import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { notificationIds } = await request.json();

        if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
            return NextResponse.json({ error: "Invalid notification IDs" }, { status: 400 });
        }

        await connectToDatabase();
        const userId = new mongoose.Types.ObjectId((session.user as any).id);

        // Update strictly only if the recipient is the current user
        await Notification.updateMany(
            {
                _id: { $in: notificationIds },
                recipient: userId
            },
            { $set: { read: true } }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
