
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import UserModel from "@/models/User";

import { connectToDatabase } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { password } = await req.json();
        if (!password) return NextResponse.json({ error: "Password required" }, { status: 400 });

        await connectToDatabase();
        const user = await UserModel.findById((session.user as any).id).select("+password");

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Validate password
        // (If OAuth user tries to delete, they might not have password. UI should handle this case or force set pass)
        if (user.password) {
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
        } else {
            // Handle OAuth deletion safety check? 
            // For now, fail if no password set (security precaution).
            return NextResponse.json({ error: "Please set a password before deleting your account." }, { status: 400 });
        }

        // Soft Delete
        user.isDeleted = true;
        user.deletedAt = new Date();
        user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate sessions

        // Anonymize critical fields? 
        // user.email = `deleted_${user._id}@deleted.local`; // Optional, maybe later for hard delete

        await user.save();



        // TODO: Trigger async cleanup job (ImageKit, etc)

        return NextResponse.json({ message: "Account deleted." });

    } catch (error) {
        console.error("Delete Account Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
