
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import UserModel from "@/models/User";
import { connectToDatabase } from "@/lib/db";
import { authenticator } from "@otplib/preset-default";

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

        const expectedCode = authenticator.generate(user.twoFactorSecret);
        console.log(`\n🔑 [DEV] Expected 2FA OTP Code (Setup): ${expectedCode}\n`);

        // Allow 1-step window before/after for better compatibility (clock drift)
        authenticator.options = { window: 1 };

        const isValid = authenticator.verify({
            token: code.replace(/\s/g, ''),
            secret: user.twoFactorSecret
        });

        if (!isValid) {
            return NextResponse.json({ error: "Invalid authenticator code" }, { status: 400 });
        }

        user.twoFactorEnabled = true;
        await user.save();

        return NextResponse.json({ message: "Two-Factor Authentication Enabled" });

    } catch (error) {
        console.error("2FA Verify Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
