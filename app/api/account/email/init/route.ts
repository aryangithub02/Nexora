
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import UserModel from "@/models/User";
import { connectToDatabase } from "@/lib/db";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { newEmail } = await req.json();

        if (!newEmail || !newEmail.includes("@")) {
            return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
        }

        await connectToDatabase();

        // Check availability
        const existing = await UserModel.findOne({ email: newEmail });
        if (existing) {
            return NextResponse.json({ error: "Email already in use" }, { status: 400 });
        }

        const user = await UserModel.findById((session.user as any).id);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Generate Verification Token (OTP)
        const otp = crypto.randomInt(100000, 999999).toString();
        const tokenHash = await bcrypt.hash(otp, 10);

        // Save to DB
        user.pendingEmail = newEmail;
        user.emailChangeToken = tokenHash;
        user.emailChangeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await user.save();

        // SIMULATE EMAIL SENDING
        console.log(`[EMAIL MOCK] To: ${newEmail}, Subject: Verify Email Change, Code: ${otp}`);

        // In production: await sendEmail(newEmail, "Verify Email", `Your code is ${otp}`);

        return NextResponse.json({ message: "Verification code sent to " + newEmail });

    } catch (error) {
        console.error("Email Init Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
