"use client";

import { X, Heart, MessageCircle, ChevronRight, Hash } from "lucide-react";
import Link from "next/link";
import { IVideo } from "@/models/Video";

interface CaptionSheetProps {
    video: IVideo;
    creatorProfile: {
        displayName?: string;
        username?: string;
        avatarUrl?: string;
    } | null;
    likeCount: number;
    commentCount: number;
    onClose: () => void;
    onOpenComments: () => void;
}

export default function CaptionSheet({
    video,
    creatorProfile,
    likeCount,
    commentCount,
    onClose,
    onOpenComments,
}: CaptionSheetProps) {
    // Extract hashtags from description
    const extractHashtags = (text: string) => {
        const hashtagRegex = /#\w+/g;
        return text.match(hashtagRegex) || [];
    };

    // Extract mentions from description
    const extractMentions = (text: string) => {
        const mentionRegex = /@\w+/g;
        return text.match(mentionRegex) || [];
    };

    const hashtags = extractHashtags(video.description || "");
    const mentions = extractMentions(video.description || "");

    // Remove hashtags and mentions from description for clean display
    const cleanDescription = (video.description || "")
        .replace(/#\w+/g, "")
        .replace(/@\w+/g, "")
        .trim();

    const formatCount = (count: number) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    const getCreatorInitial = (email: string | undefined) => {
        if (!email) return "U";
        return email.charAt(0).toUpperCase();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 z-[100] animate-fade-in"
                onClick={onClose}
            />

            {/* Sheet - Centered on desktop, full-width on mobile */}
            <div
                className="fixed z-[101] animate-slide-up bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:max-w-[480px] md:rounded-t-3xl"
                style={{
                    height: "60vh",
                    maxHeight: "500px",
                    background: "rgba(15, 17, 23, 0.98)",
                    borderRadius: "24px 24px 0 0",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.5)",
                }}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        {/* Creator Avatar */}
                        <Link
                            href={`/profile/${video.uploadedBy?._id}`}
                            className="flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#2DE2A6] p-[2px]">
                                <div className="w-full h-full rounded-full bg-[#0F1117] flex items-center justify-center overflow-hidden">
                                    {creatorProfile?.avatarUrl ? (
                                        <img
                                            src={creatorProfile.avatarUrl}
                                            alt={creatorProfile.displayName || "Creator"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-white text-sm font-bold">
                                            {getCreatorInitial(video.uploadedBy?.email)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>

                        {/* Creator Info */}
                        <div className="min-w-0">
                            <Link
                                href={`/profile/${video.uploadedBy?._id}`}
                                className="text-white font-semibold text-sm hover:text-[#4F8CFF] transition-colors block truncate"
                            >
                                {creatorProfile?.displayName ||
                                    video.uploadedBy?.email?.split("@")[0] ||
                                    "Creator"}
                            </Link>
                            <p className="text-white/50 text-xs">
                                @{creatorProfile?.username || video.uploadedBy?.email?.split("@")[0]}
                            </p>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5 text-white/70" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div
                    className="overflow-y-auto px-5 py-4"
                    style={{ height: "calc(100% - 140px)" }}
                >
                    {/* Title */}
                    <h2
                        className="text-white font-bold text-lg mb-3"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                        {video.title}
                    </h2>

                    {/* Full Description */}
                    {cleanDescription && (
                        <p
                            className="text-white/80 text-sm leading-relaxed mb-4"
                            style={{ fontFamily: "var(--font-inter)" }}
                        >
                            {cleanDescription}
                        </p>
                    )}

                    {/* Hashtags */}
                    {hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {hashtags.map((tag, index) => (
                                <button
                                    key={index}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#4F8CFF]/10 text-[#4F8CFF] text-xs font-medium hover:bg-[#4F8CFF]/20 transition-colors"
                                >
                                    <Hash className="w-3 h-3" />
                                    {tag.replace("#", "")}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Mentions */}
                    {mentions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {mentions.map((mention, index) => (
                                <Link
                                    key={index}
                                    href={`/discover?search=${mention.replace("@", "")}`}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#2DE2A6]/10 text-[#2DE2A6] text-xs font-medium hover:bg-[#2DE2A6]/20 transition-colors"
                                >
                                    {mention}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Meta Info */}
                    <div className="text-white/40 text-xs mt-4">
                        {video.createdAt && (
                            <span>
                                Posted{" "}
                                {new Date(video.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                            </span>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 px-5 py-4 border-t border-white/10 bg-[#0F1117]/80 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        {/* Stats */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-1.5 text-white/60">
                                <Heart className="w-4 h-4" />
                                <span className="text-xs font-medium">{formatCount(likeCount)} likes</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-white/60">
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-xs font-medium">{formatCount(commentCount)} comments</span>
                            </div>
                        </div>

                        {/* Go to Comments */}
                        <button
                            onClick={() => {
                                onClose();
                                onOpenComments();
                            }}
                            className="flex items-center gap-1 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
                        >
                            View Comments
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
