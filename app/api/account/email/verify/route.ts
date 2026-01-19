
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

        const { otp } = await req.json();

        if (!otp) return NextResponse.json({ error: "OTP is required" }, { status: 400 });

        await connectToDatabase();
        const user = await UserModel.findById((session.user as any).id);

        if (!user || !user.pendingEmail || !user.emailChangeToken) {
            return NextResponse.json({ error: "No pending email change" }, { status: 400 });
        }

        if (user.emailChangeExpires && new Date() > user.emailChangeExpires) {
            return NextResponse.json({ error: "Code expired" }, { status: 400 });
        }

        const isValid = await bcrypt.compare(otp, user.emailChangeToken);

        if (!isValid) {
            return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
        }

        // Apply change
        user.email = user.pendingEmail;
        user.pendingEmail = undefined;
        user.emailChangeToken = undefined;
        user.emailChangeExpires = undefined;

        // Security practice: Invalidate sessions on email change
        user.tokenVersion = (user.tokenVersion || 0) + 1;

        try {
            await user.save();
        } catch (e: any) {
            if (e.code === 11000) {
                return NextResponse.json({ error: "Email already taken by another user" }, { status: 400 });
            }
            throw e;
        }



        return NextResponse.json({ message: "Email updated successfully. Please login again." });

    } catch (error) {
        console.error("Email Verify Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
