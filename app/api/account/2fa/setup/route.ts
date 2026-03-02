
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

        const secret = authenticator.generateSecret();

        const serviceName = "Nexora";

        const otpauth = authenticator.keyuri(user.email, serviceName, secret);

        const qrCodeUrl = await qrcode.toDataURL(otpauth);

        user.twoFactorSecret = secret;
        await user.save();

        const currentCode = authenticator.generate(secret);
        console.log(`\n🔑 [DEV] 2FA Setup Initiated for User: ${user._id}\nSecret: ${secret}\nInitial Code: ${currentCode}\n`);

        return NextResponse.json({
            secret,
            qrCodeUrl
        });

    } catch (error) {
        console.error("2FA Setup Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
