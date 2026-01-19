
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

        const { oldPassword, newPassword } = await req.json();

        if (!oldPassword || !newPassword) {
            return NextResponse.json(
                { error: "Old and new password are required" },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
        }

        await connectToDatabase();

        // Explicitly select password field as it might be excluded by default
        const user = await UserModel.findById((session.user as any).id).select("+password");

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user has a password (might be OAuth only)
        if (!user.password) {
            return NextResponse.json({ error: "Account uses social login only. No password to change." }, { status: 400 });
        }

        const isValid = await bcrypt.compare(oldPassword, user.password);

        if (!isValid) {
            return NextResponse.json({ error: "Incorrect old password" }, { status: 400 });
        }

        // Update password
        user.password = await bcrypt.hash(newPassword, 10);
        user.passwordUpdatedAt = new Date();

        // Invalidate all sessions (including current)
        user.tokenVersion = (user.tokenVersion || 0) + 1;

        await user.save();



        return NextResponse.json({ message: "Password changed successfully" });

    } catch (error) {
        console.error("Password Change Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
