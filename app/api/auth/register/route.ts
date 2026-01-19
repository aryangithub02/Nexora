import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(request: NextRequest){
    try {
        const { email, password } = await request.json();

        if(!email || !password){
            return NextResponse.json(
                { error: "Email and password are required" }, 
                { status: 400 }
            );
        }

        await connectToDatabase();

        const existingUser = await User.findOne({ email });

        if(existingUser){
            return NextResponse.json(
                { error: "User already exists" }, 
                { status: 400 }
            );
        }

        const newUser = await User.create({ email, password });
        console.log("New user created:", newUser);
        return NextResponse.json( 
            { message: "User created successfully" },
            { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to register user" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const connection = await connectToDatabase();
        
        const connectionState = mongoose.connection.readyState;
        const stateMessages = {
            0: "disconnected",
            1: "connected",
            2: "connecting",
            3: "disconnecting"
        };

        return NextResponse.json({
            status: "success",
            message: stateMessages[connectionState as keyof typeof stateMessages]
        });
        console.log("Database connection state:", stateMessages[connectionState as keyof typeof stateMessages]);
    } catch (error: any) {
        console.error("Registration error:", error); 
        return NextResponse.json({
            status: "error",
            database: {
                connected: false,
                error: error.message || "Failed to connect to database"
            }
        }, { status: 500 });
    }
}

