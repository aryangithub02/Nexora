import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

export async function POST(request: NextRequest) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
        }

        console.log("Reset Password: Received token:", token);

        await connectToDatabase();

        // Debug: Find user by token only to see if it exists (ignoring expiry for a moment)
        const userByToken = await User.findOne({ resetPasswordToken: token });
        console.log("Reset Password: User found by token (ignoring expiry):", userByToken ? userByToken.email : "null");

        if (userByToken) {
            console.log("Token in DB:", userByToken.resetPasswordToken);
            console.log("Expires in DB:", userByToken.resetPasswordExpires);
            console.log("Current Time:", new Date());
            console.log("Valid?", userByToken.resetPasswordExpires > new Date());
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() },
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
        }

        user.password = password; // Will be hashed by pre-save hook in User model
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        return NextResponse.json({ message: "Password reset successful" });

    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
