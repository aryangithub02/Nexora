import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import crypto from "crypto";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();
        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        await connectToDatabase();

        const user = await User.findOne({ email });
        if (!user) {
            // Return 200 even if user not found for security (user enumeration prevention)
            return NextResponse.json({ message: "If an account exists with this email, a reset link has been sent." }, { status: 200 });
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString("hex");

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

        await user.save();

        // In a real app, send email here.
        // For local dev, we log it.
        const resetUrl = `${request.nextUrl.origin}/reset-password?token=${resetToken}`;

        console.log("=================================================================");
        console.log(`PASSWORD RESET LINK FOR ${email}:`);
        console.log(resetUrl);
        console.log("=================================================================");

        return NextResponse.json({
            message: "If an account exists with this email, a reset link has been sent.",
            resetLink: resetUrl // Returning link to UI for dev/testing ease
        }, { status: 200 });

    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
