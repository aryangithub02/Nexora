
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

        await connectToDatabase();
        const user = await UserModel.findById((session.user as any).id);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Generate 10 codes
        const codes = [];
        const hashedCodes = [];

        for (let i = 0; i < 10; i++) {
            const code = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 chars
            codes.push(code);
            const hash = await bcrypt.hash(code, 10);
            hashedCodes.push(hash);
        }

        // Replace existing codes
        user.backupCodes = hashedCodes;
        await user.save();

        return NextResponse.json({ codes });

    } catch (error) {
        console.error("Backup Codes Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
