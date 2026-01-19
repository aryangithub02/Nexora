
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import UserModel from "@/models/User";
import { connectToDatabase } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // In a real app, require password here
        await connectToDatabase();
        const user = await UserModel.findById((session.user as any).id);

        if (user) {
            user.twoFactorEnabled = false;
            user.twoFactorSecret = undefined;
            await user.save();
        }

        return NextResponse.json({ message: "2FA Disabled" });

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
