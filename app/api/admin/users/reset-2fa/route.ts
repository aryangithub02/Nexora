
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import UserModel from "@/models/User";

export async function POST(req: Request) {
    try {
        const { username, password, userId } = await req.json();

        // Hardcoded credentials for admin
        if (username === "admin" && password === "nexora@07") {
            if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

            await connectToDatabase();
            const user = await UserModel.findById(userId);

            if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

            user.twoFactorEnabled = false;
            user.twoFactorSecret = undefined;
            user.backupCodes = [];
            await user.save();

            return NextResponse.json({ message: "2FA Reset successful" });
        }

        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } catch (error) {
        console.error("Admin Reset 2FA Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
