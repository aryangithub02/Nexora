"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { IVideo } from "@/models/Video";
import { apiClient } from "@/lib/api-client";
import Feed from "@/app/components/Feed";
import FloatingUploadButton from "@/app/components/FloatingUploadButton";
import LeftSpine from "@/app/components/LeftSpine";
import RightPanel from "@/app/components/RightPanel";
import { Loader2 } from "lucide-react";
import ReelSkeleton from "@/app/components/ReelSkeleton";

// Separate component that uses useSearchParams
function HomeContent() {
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileMode, setProfileMode] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('reelId');

  useEffect(() => {
    // Redirect to register if not authenticated
    if (status === "unauthenticated") {
      router.push("/register");
      return;
    }

    // Only fetch videos if authenticated
    if (status === "authenticated") {
      // 1. Log Session
      fetch("/api/sessions", { method: "POST" }).catch(err => console.error("Session log failed", err));

      const fetchVideos = async () => {
        try {
          const data = await apiClient.getVideos();

          // Targeted hydration: Ensure the requested reel exists
          if (highlightId) {
            const exists = data.find(v => v._id.toString() === highlightId);
            if (!exists) {
              try {
                const targetReel = await apiClient.getAVideo(highlightId);
                if (targetReel) {
                  // Prepend the target reel so it's guaranteed to be DOM-present
                  data.unshift(targetReel);
                }
              } catch (err: any) {
                // If video is not found (404), it's expected (e.g. deleted), so don't log error
                const isNotFound = err.message && (err.message.includes("Video not found") || err.message.includes("404"));
                if (!isNotFound) {
                  console.error("Could not hydrate target reel:", err);
                }
              }
            }
          }

          setVideos(data);
        } catch (error) {
          console.error("Error fetching videos:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchVideos();
    }
  }, [status, router, highlightId]);

  const toggleProfileMode = () => {
    setProfileMode(!profileMode);
  };

  const handleVideoDeleted = (deletedId: string) => {
    setVideos((prevVideos) => prevVideos.filter((v) => v._id.toString() !== deletedId));
  };

  // Show loading while checking authentication
  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-[var(--bg-main)] relative overflow-hidden">
        {/* Skeleton Layout: Matches the real layout */}
        <div className="hidden md:block fixed left-0 top-0 bottom-0 z-40">
          <LeftSpine onAvatarClick={toggleProfileMode} />
        </div>

        <div className="w-full h-full md:h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide relative feed-envelope">
          {/* Show 2 skeletons to suggest scrolling */}
          <div className="flex flex-col items-center w-full pt-20">
            <ReelSkeleton />
            <div className="hidden md:block opacity-50"><ReelSkeleton /></div>
          </div>
        </div>

        <div className="hidden lg:block fixed right-0 top-0 bottom-0 z-40">
          <RightPanel profileMode={profileMode} toggleProfileMode={toggleProfileMode} />
        </div>
      </main>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (status === "unauthenticated") {
    return null;
  }

  if (!videos.length) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <div className="text-center">
          <p
            className="text-[var(--text-muted)] text-lg mb-4"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            No videos yet.
          </p>
          <p
            className="text-[#5C6270] text-sm"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Upload your first reel to get started
          </p>
        </div>
        <div className="hidden md:block">
          <FloatingUploadButton />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-main)] relative overflow-hidden">
      {/* 1. Left Spine - Navigation (Desktop Only, Fixed) */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 z-40">
        <LeftSpine onAvatarClick={toggleProfileMode} />
      </div>

      {/* 2. Center Lens - Cinematic Feed */}
      {/* On mobile: full width in normal flow */}
      {/* On desktop: positioned via CSS .feed-envelope class */}
      <Feed videos={videos} onVideoDeleted={handleVideoDeleted} />

      {/* 3. Right Panel - Social Radar & Context (Desktop Only, Fixed) */}
      <div className="hidden lg:block fixed right-0 top-0 bottom-0 z-40">
        <RightPanel profileMode={profileMode} toggleProfileMode={toggleProfileMode} />
      </div>

      <div className="hidden md:block">
        <FloatingUploadButton />
      </div>
    </main>
  );
}

// Main page component wrapped in Suspense
export default function Home() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <HomeContent />
    </React.Suspense>
  );
}
