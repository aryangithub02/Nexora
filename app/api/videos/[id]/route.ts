import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import Video from "@/models/Video";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await context.params;

        // Same aggregation as list but for one video
        const videos = await Video.aggregate([
            { $match: { _id: new (require('mongoose').Types.ObjectId)(id) } },
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
                    "uploadedBy.displayName": "$uploaderProfile.displayName"
                }
            },
            {
                $project: {
                    uploaderProfile: 0
                }
            }
        ]);

        if (!videos || videos.length === 0) {
            return NextResponse.json(
                { error: "Video not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(videos[0]);

    } catch (error) {
        console.error("Get video error:", error);
        return NextResponse.json(
            { error: "Failed to fetch video" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectToDatabase();

        // Await the params
        const { id } = await context.params;

        const video = await Video.findById(id);

        if (!video) {
            return NextResponse.json(
                { error: "Video not found" },
                { status: 404 }
            );
        }

        // Check ownership
        if (video.uploadedBy?.toString() !== (session.user as any).id && video.uploadedBy?._id?.toString() !== (session.user as any).id) {
            // Logic to handle different potential structures of uploadedBy, primarily matching the creation logic
            // logic: (session.user as any).id
            // video.uploadedBy might be an object with _id, or just an ID if not populated (though defined as object in schema)
            // Schema says: uploadedBy: { _id: ObjectId ... }

            // Let's be careful with the check.
            if (video.uploadedBy?._id?.toString() !== (session.user as any).id) {
                return NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 403 }
                );
            }
        }

        await Video.findByIdAndDelete(id);

        return NextResponse.json(
            { message: "Video deleted successfully" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Delete video error:", error);
        return NextResponse.json(
            { error: "Failed to delete video" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectToDatabase();

        // Await the params to fix the "params is promise" error
        const { id } = await context.params;
        const body = await request.json();
        const { title, description } = body;

        const video = await Video.findById(id);

        if (!video) {
            return NextResponse.json(
                { error: "Video not found" },
                { status: 404 }
            );
        }

        // Check ownership
        if (video.uploadedBy?.toString() !== (session.user as any).id && video.uploadedBy?._id?.toString() !== (session.user as any).id) {
            if (video.uploadedBy?._id?.toString() !== (session.user as any).id) {
                return NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 403 }
                );
            }
        }

        // Update fields if provided
        if (title !== undefined) video.title = title;
        if (description !== undefined) video.description = description;

        await video.save();

        return NextResponse.json(
            { message: "Video updated successfully", video },
            { status: 200 }
        );

    } catch (error) {
        console.error("Update video error:", error);
        return NextResponse.json(
            { error: "Failed to update video" },
            { status: 500 }
        );
    }
}
