import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ProfileLayout from "@/app/components/ProfileLayout";
import ProfileEditor from "@/app/components/ProfileEditor";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import Profile from "@/models/Profile";

export default async function ProfileSettingsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/login");
    }

    await connectToDatabase();

    // Fetch existing profile or return null to prompt creation
    const profileDoc = await Profile.findOne({ userId: session.user.id }).lean();

    // Serializing because Mongoose objects are not plain JS objects
    const profile = profileDoc ? JSON.parse(JSON.stringify(profileDoc)) : null;

    return (
        <ProfileLayout>
            <ProfileEditor initialProfile={profile} />
        </ProfileLayout>
    );
}
