
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

        const codes = [];

        for (let i = 0; i < 10; i++) {
            const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
            const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
            const code = `${part1}-${part2}`;
            codes.push(code);
        }

        user.backupCodes = codes;
        await user.save();

        return NextResponse.json({ codes });

    } catch (error) {
        console.error("Backup Codes Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
