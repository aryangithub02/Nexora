import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Notification from "@/models/Notification";
import Video from "@/models/Video";
import Profile from "@/models/Profile";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const userId = new mongoose.Types.ObjectId((session.user as any).id);

        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        // Collect IDs for enrichment
        const actorIds = [...new Set(notifications.map(n => n.actor.toString()))];
        const reelIds = [...new Set(notifications.filter(n => n.entityType === "Reel" && n.entityId).map(n => n.entityId!.toString()))];

        // Fetch Data
        const [profiles, videos] = await Promise.all([
            Profile.find({ userId: { $in: actorIds } }).lean(),
            Video.find({ _id: { $in: reelIds } }).select("thumbnailUrl").lean()
        ]);

        const profileMap = new Map(profiles.map((p: any) => [p.userId.toString(), p]));
        const videoMap = new Map(videos.map((v: any) => [v._id.toString(), v]));

        // Enrich
        const enrichedNotifications = notifications.map((notif: any) => {
            const actorProfile = profileMap.get(notif.actor.toString());
            const video = (notif.entityType === "Reel" && notif.entityId) ? videoMap.get(notif.entityId.toString()) : null;

            return {
                ...notif,
                actor: {
                    _id: notif.actor,
                    username: actorProfile?.username || "Unknown",
                    avatarUrl: actorProfile?.avatarUrl,
                },
                contextMediaUrl: video?.thumbnailUrl || null
            };
        });

        return NextResponse.json({ notifications: enrichedNotifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { notificationId } = body;

        if (!notificationId) {
            return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
        }

        await connectToDatabase();
        const userId = new mongoose.Types.ObjectId((session.user as any).id);

        // Only delete if the notification belongs to the current user
        const result = await Notification.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(notificationId),
            recipient: userId
        });

        if (!result) {
            return NextResponse.json({ error: "Notification not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting notification:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
