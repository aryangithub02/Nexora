
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import UserModel from "@/models/User";
import { connectToDatabase } from "@/lib/db";
import { verify } from "otplib";



export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { code } = await req.json();

        if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

        await connectToDatabase();
        const user = await UserModel.findById((session.user as any).id);
        if (!user || !user.twoFactorSecret) {
            return NextResponse.json({ error: "2FA setup not initiated" }, { status: 400 });
        }

        // Use top-level verify (which might be async in this version)
        const isValid = await verify({ token: code, secret: user.twoFactorSecret });

        if (!isValid) {
            return NextResponse.json({ error: "Invalid authenticator code" }, { status: 400 });
        }

        // Enable 2FA
        user.twoFactorEnabled = true;
        await user.save();

        return NextResponse.json({ message: "Two-Factor Authentication Enabled" });

    } catch (error) {
        console.error("2FA Verify Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
