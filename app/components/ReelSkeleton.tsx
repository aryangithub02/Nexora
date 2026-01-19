import React from "react";
import Skeleton from "./Skeleton";

/**
 * ReelSkeleton
 * 
 * A premium loading state for the main Reel Feed.
 * Mimics the ReelCard layout: Video stage, Side actions, Bottom caption.
 */
export default function ReelSkeleton() {
    return (
        <div className="relative w-full h-[100dvh] md:h-[85vh] md:w-[400px] md:rounded-[32px] overflow-hidden bg-[var(--bg-main)] md:bg-[var(--bg-card)] border border-[var(--border-soft)] mb-6 flex-shrink-0 snap-center mx-auto">

            {/* Top Header Placeholder */}
            <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex items-center gap-2">
                    {/* Location/pill */}
                    <Skeleton className="w-[100px] h-8 rounded-full bg-white/10" />
                </div>
                {/* Search icon */}
                <Skeleton className="w-10 h-10 rounded-full bg-white/10" />
            </div>

            {/* Video Stage Placeholder (The main visual) */}
            <div className="absolute inset-0 bg-[#0F1117]">
                {/* Center icon placeholder (like a loading logo) */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <Skeleton className="w-16 h-16 rounded-full bg-white/5 opacity-50" />
                </div>
            </div>

            {/* Sidebar Controls (Right) */}
            <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center z-20">
                <Skeleton className="w-10 h-10 rounded-full bg-white/10" /> {/* Like */}
                <Skeleton className="w-10 h-10 rounded-full bg-white/10" /> {/* Comment */}
                <Skeleton className="w-10 h-10 rounded-full bg-white/10" /> {/* Share */}
                <Skeleton className="w-10 h-10 rounded-full bg-white/10" /> {/* Bookmark */}
                <Skeleton className="w-8 h-8 rounded-full bg-white/10 mt-4" /> {/* Song Art */}
            </div>

            {/* Bottom Content (Left) */}
            <div className="absolute bottom-0 left-0 right-16 p-6 z-20">
                {/* User Row */}
                <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="w-10 h-10 rounded-full bg-white/10" /> {/* Avatar */}
                    <div className="flex flex-col gap-2">
                        <Skeleton className="w-24 h-4 rounded-md bg-white/10" /> {/* Username */}
                    </div>
                    <Skeleton className="w-16 h-7 rounded-full bg-white/10 ml-2" /> {/* Follow btn */}
                </div>

                {/* Caption Lines */}
                <div className="space-y-2 mb-4">
                    <Skeleton className="w-3/4 h-3 rounded-sm bg-white/10" />
                    <Skeleton className="w-1/2 h-3 rounded-sm bg-white/10" />
                </div>

                {/* Audio Tag */}
                <Skeleton className="w-32 h-6 rounded-full bg-white/10" />
            </div>

            {/* Bottom Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <Skeleton className="h-full w-1/3 bg-[var(--accent)]/50" />
            </div>
        </div>
    );
}
