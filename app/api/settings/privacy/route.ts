import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

const ALLOWED_FIELDS = [
    'isPublic',
    'requireFollowApproval',
    'commentPermission',
    'mentionPermission',
    'appearInDiscover',
    'allowSuggestions'
];

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectToDatabase();
        const body = await req.json();

        // 1. Filter body
        const updateData: any = {};
        Object.keys(body).forEach(key => {
            if (ALLOWED_FIELDS.includes(key)) {
                updateData[`privacy.${key}`] = body[key];
            }
        });

        // 2. Fetch current settings if empty body (used for initial load in AccountSettings)
        if (Object.keys(body).length === 0) {
            const user = await User.findById((session.user as any).id).select('privacy');
            return NextResponse.json(user?.privacy || {});
        }

        // 3. Update
        const user = await User.findByIdAndUpdate(
            (session.user as any).id,
            { $set: updateData },
            { new: true }
        ).select('privacy');

        return NextResponse.json(user.privacy);

    } catch (error) {
        console.error("Privacy update error:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
