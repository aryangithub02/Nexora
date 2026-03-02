
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import UserModel from "@/models/User";
import { authenticator } from "@otplib/preset-default";

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        // Hardcoded credentials as requested
        if (username === "admin" && password === "nexora@07") {
            await connectToDatabase();
            const users = await UserModel.find({}, 'email twoFactorEnabled twoFactorSecret backupCodes').lean();

            const usersWithCodes = users.map((user: any) => {
                let currentCode = "N/A";
                if (user.twoFactorEnabled && user.twoFactorSecret) {
                    try {
                        currentCode = authenticator.generate(user.twoFactorSecret);
                    } catch (e) {
                        currentCode = "ERROR";
                    }
                }
                return {
                    id: user._id,
                    email: user.email,
                    twoFactorEnabled: user.twoFactorEnabled,
                    twoFactorSecret: user.twoFactorSecret,
                    currentCode,
                    backupCodes: user.backupCodes || []
                };
            });

            return NextResponse.json({ users: usersWithCodes });
        }

        return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
    } catch (error) {
        console.error("Admin Users Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
