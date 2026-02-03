
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import UserModel from "@/models/User";

import { connectToDatabase } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { password } = await req.json();
        if (!password) return NextResponse.json({ error: "Password required" }, { status: 400 });

        await connectToDatabase();
        const user = await UserModel.findById((session.user as any).id).select("+password");

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (user.password) {
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
        } else {

            return NextResponse.json({ error: "Please set a password before deleting your account." }, { status: 400 });
        }

        user.isDeleted = true;
        user.deletedAt = new Date();
        user.tokenVersion = (user.tokenVersion || 0) + 1; 

        await user.save();

        return NextResponse.json({ message: "Account deleted." });

    } catch (error) {
        console.error("Delete Account Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
