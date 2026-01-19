import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Session from "@/models/Session";
import { UAParser } from "ua-parser-js";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectToDatabase();

        // Use headers() to get full headers object if needed, but get() works for specific keys
        // Note: next/headers is for server components, req.headers is correct here
        const userAgent = req.headers.get("user-agent") || "Unknown";
        // Getting IP in Next.js/Vercel/Node environment
        const ip = (req.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0];

        // Parse UA for device info
        const parser = new UAParser(userAgent);
        const device = parser.getDevice();
        const os = parser.getOS();
        const browser = parser.getBrowser();

        let deviceType = "Desktop";
        if (device.type === "mobile") deviceType = "Mobile";
        else if (device.type === "tablet") deviceType = "Tablet";

        const deviceString = `${deviceType} - ${os.name || "Unknown OS"} (${browser.name || "Browser"})`;

        // Check for existing active session (within last 30 mins, same IP/UA)
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

        const existingSession = await Session.findOne({
            userId: (session.user as any).id,
            ipAddress: ip,
            userAgent: userAgent,
            lastActive: { $gt: thirtyMinsAgo }
        });

        if (existingSession) {
            existingSession.lastActive = new Date();
            await existingSession.save();
        } else {
            await Session.create({
                userId: (session.user as any).id,
                ipAddress: ip,
                userAgent: userAgent,
                deviceType: deviceString,
                lastActive: new Date()
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Session log error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectToDatabase();

        const history = await Session.find({ userId: (session.user as any).id })
            .sort({ lastActive: -1 })
            .limit(10); // Last 10 sessions

        return NextResponse.json(history);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
