import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import Video, { IVideo } from "@/models/Video";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { error } from "console";

import User from "@/models/User";

import Follow from "@/models/Follow";
import mongoose from "mongoose";

export async function GET() {
    try {
        await connectToDatabase();
        const session = await getServerSession(authOptions);

        let followingIds: any[] = [];
        let currentUserId = null;

        if (session) {
            currentUserId = (session.user as any).id;
            const following = await Follow.find({ followerId: currentUserId }).select("followingId");
            followingIds = following.map(f => f.followingId.toString());
        }

        const videos = await Video.aggregate([
            { $sort: { createdAt: -1 } },
            
            {
                $lookup: {
                    from: "users",
                    localField: "uploadedBy._id",
                    foreignField: "_id",
                    as: "uploaderUser"
                }
            },
            {
                $unwind: {
                    path: "$uploaderUser",
                    preserveNullAndEmptyArrays: true
                }
            },
            
            {
                $match: {
                    $or: [
                        
                        { "uploaderUser.privacy.isPublic": { $ne: false } },
                        
                        { "uploadedBy._id": currentUserId ? new mongoose.Types.ObjectId(currentUserId) : null },
                        
                        {
                            "uploadedBy._id": {
                                $in: followingIds.map(id => new mongoose.Types.ObjectId(id))
                            }
                        }
                    ]
                }
            },
            
            {
                $lookup: {
                    from: "profiles",
                    localField: "uploadedBy._id",
                    foreignField: "userId",
                    as: "uploaderProfile"
                }
            },
            {
                $unwind: {
                    path: "$uploaderProfile",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    "uploadedBy.avatarUrl": "$uploaderProfile.avatarUrl",
                    "uploadedBy.username": "$uploaderProfile.username",
                    "uploadedBy.displayName": "$uploaderProfile.displayName",
                    
                    "uploadedBy.commentPermission": "$uploaderUser.privacy.commentPermission"
                }
            },
            {
                $project: {
                    uploaderProfile: 0,
                    uploaderUser: 0 
                }
            }
        ]);

        if (!videos || videos.length === 0) {
            return NextResponse.json([], { status: 200 });
        }

        const videosMissingId = videos.filter(v => v.uploadedBy?.email && !v.uploadedBy._id);

        if (videosMissingId.length > 0) {
            const emails = videosMissingId.map(v => v.uploadedBy!.email!);
            const users = await User.find({ email: { $in: emails } }).select("_id email").lean();
            const userMap = new Map(users.map(u => [u.email, u._id]));

            await Promise.all(videosMissingId.map(async (video) => {
                const userId = userMap.get(video.uploadedBy!.email!);
                if (userId) {
                    video.uploadedBy!._id = userId;
                    await Video.updateOne(
                        { _id: video._id },
                        { $set: { "uploadedBy._id": userId } }
                    );
                }
            }));
        }

        return NextResponse.json(videos);
    } catch (error) {
        console.error("Feed error:", error);
        return NextResponse.json(
            { error: "Failed to fetch the videos" },
            { status: 200 } 
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }
        await connectToDatabase()
        const body: IVideo = await request.json()
        console.log("Creating video with body:", body);
        console.log("Session user:", session.user);

        if (!body.title || !body.description || !body.videoUrl || !body.thumbnailUrl) {
            console.error("Missing fields:", { title: body.title, description: body.description, videoUrl: body.videoUrl, thumbnailUrl: body.thumbnailUrl });
            return NextResponse.json(
                { error: "Missing Required Fields" },
                { status: 400 }
            )
        }
        const videoData = {
            ...body,
            uploadedBy: {
                _id: (session.user as any).id,
                email: session.user?.email || undefined,
                name: session.user?.name || undefined,
            },
            controls: body.controls ?? true,
            transformation: {
                height: 1920,
                width: 1080,
                quality: body.transformation?.quality ?? 100
            }

        }

        const newVideo = await Video.create(videoData);
        return NextResponse.json(newVideo);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to create a video" },
            { status: 200 }
        )
    }
}