
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import UserModel from "@/models/User";
import { connectToDatabase } from "@/lib/db";
import { authenticator } from "@otplib/preset-default";
import qrcode from "qrcode";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const user = await UserModel.findById((session.user as any).id);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Generate Secret
        // Generate Secret
        const secret = authenticator.generateSecret();
        // Note: The 'totp.verify' line from the instruction is typically used in a separate endpoint for 2FA verification,
        // not during the setup phase where the secret is generated.
        // For example, in a verification endpoint, you might have:
        // const { code } = await req.json();
        // const isValid = totp.verify({ token: code, secret: user.twoFactorSecret });
        const serviceName = "Nexora";

        const otpauth = authenticator.keyuri(user.email, serviceName, secret);

        // Generate QR Code
        const qrCodeUrl = await qrcode.toDataURL(otpauth);

        // Save secret but do NOT enable yet
        user.twoFactorSecret = secret;
        await user.save();

        return NextResponse.json({
            secret,
            qrCodeUrl
        });

    } catch (error) {
        console.error("2FA Setup Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
