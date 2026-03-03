"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Bookmark, Play, Clock, Sparkles, BookmarkX } from "lucide-react";
import LeftSpine from "@/app/components/LeftSpine";
import Link from "next/link";

interface SavedReel {
    _id: string;
    videoId: {
        _id: string;
        title: string;
        description: string;
        videoUrl: string;
        thumbnailUrl: string;
        uploadedBy?: {
            _id?: string;
            email?: string;
            name?: string;
        };
        createdAt?: string;
    };
    revisitCount: number;
    lastVisitedAt: string;
    createdAt: string;
}

type SortMode = 'memory' | 'recent';

export default function SavedPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [bookmarks, setBookmarks] = useState<SavedReel[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSort, setActiveSort] = useState<SortMode>('memory');
    const [hoveredReel, setHoveredReel] = useState<string | null>(null);
    const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

    useEffect(() => {
        const fetchBookmarks = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/bookmarks?all=true&sortBy=${activeSort}`);
                if (res.ok) {
                    const data = await res.json();
                    setBookmarks(data.bookmarks || []);
                }
            } catch (error) {
                console.error('Error fetching bookmarks:', error);
            } finally {
                setLoading(false);
            }
        };

        if (session) {
            fetchBookmarks();
        }
    }, [session, activeSort]);

    useEffect(() => {
        if (hoveredReel) {
            const video = videoRefs.current.get(hoveredReel);
            if (video) {
                video.play().catch(() => { });
            }
        }

        videoRefs.current.forEach((video, id) => {
            if (id !== hoveredReel) {
                video.pause();
                video.currentTime = 0;
            }
        });
    }, [hoveredReel]);

    const handleOpenReel = async (videoId: string) => {

        try {
            await fetch('/api/bookmarks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId })
            });
        } catch (error) {

            console.error('Failed to record revisit:', error);
        }

        router.push(`/?reelId=${videoId}&fromSaved=true`);
    };

    const getInitial = (name: string | undefined) => {
        return name?.charAt(0)?.toUpperCase() || '?';
    };

    const getVideoThumbnail = (videoUrl: string) => {
        if (!videoUrl) return '/placeholder.jpg';

        if (videoUrl.includes('imagekit.io')) {
            return `${videoUrl}/ik-thumbnail.jpg`;
        }

        return videoUrl;
    };

    const formatSavedTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) return 'Saved just now';
        if (hours < 24) return 'Saved today';
        if (days === 1) return 'Saved yesterday';
        if (days < 7) return `Saved ${days} days ago`;
        if (days < 30) return `Saved ${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
        return `Saved ${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]/60" />
            </div>
        );
    }

    if (status === "unauthenticated") {
        router.push("/login");
        return null;
    }

    return (
        <main className="min-h-screen bg-[var(--bg-main)] overflow-hidden">
            <LeftSpine onAvatarClick={() => { }} />

            { }
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-[var(--accent)]/5 rounded-full blur-[120px]" />
            </div>

            <div className="md:pl-[280px] px-4 py-4 md:py-10 pt-safe-top pb-safe-nav relative">
                {/* Section header */}
                <div className="max-w-6xl mx-auto mb-6 md:mb-10">
                    <div className="flex flex-col gap-4">
                        {/* Title row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
                                    <Bookmark className="w-5 h-5 md:w-6 md:h-6 text-[var(--accent)]/70 fill-[var(--accent)]/20" />
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl font-medium text-[var(--text-main)]/90 tracking-tight font-[family-name:var(--font-space-grotesk)]">
                                        Saved Reels
                                    </h1>
                                    <p className="text-[var(--text-muted)] text-xs mt-0.5 font-[family-name:var(--font-inter)]">
                                        Your personal collection of memories
                                    </p>
                                </div>
                            </div>

                            {/* Sort pills */}
                            <div className="flex gap-1 bg-[var(--bg-card)]/80 p-1 rounded-full border border-[var(--border-soft)]">
                                <button
                                    onClick={() => setActiveSort('memory')}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 font-[family-name:var(--font-inter)] whitespace-nowrap ${activeSort === 'memory'
                                            ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                                            : 'text-[var(--text-muted)]'
                                        }`}
                                >
                                    <Sparkles size={11} />
                                    <span className="hidden sm:inline">Most Revisited</span>
                                    <span className="sm:hidden">Top</span>
                                </button>
                                <button
                                    onClick={() => setActiveSort('recent')}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 font-[family-name:var(--font-inter)] whitespace-nowrap ${activeSort === 'recent'
                                            ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                                            : 'text-[var(--text-muted)]'
                                        }`}
                                >
                                    <Clock size={11} />
                                    <span className="hidden sm:inline">Recently Saved</span>
                                    <span className="sm:hidden">Recent</span>
                                </button>
                            </div>
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-6 font-[family-name:var(--font-jetbrains-mono)]">
                            <span className="text-[var(--text-muted)] text-xs">{bookmarks.length} saved</span>
                            <span className="text-[var(--text-muted)]/60 text-xs">{bookmarks.reduce((acc, b) => acc + b.revisitCount, 0)} total revisits</span>
                        </div>
                    </div>
                </div>

                { }
                <div className="max-w-6xl mx-auto">
                    {loading ? (
                        <div className="flex justify-center py-32">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]/40" />
                                <p className="text-[var(--text-muted)]/60 text-sm font-[family-name:var(--font-inter)]">
                                    Loading memories...
                                </p>
                            </div>
                        </div>
                    ) : bookmarks.length === 0 ? (
                        <div className="text-center py-32">
                            <BookmarkX className="w-12 h-12 text-[var(--text-muted)]/20 mx-auto mb-4" />
                            <p className="text-[var(--text-muted)]/60 text-sm font-[family-name:var(--font-inter)] mb-6">
                                No memories saved yet
                            </p>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-[var(--accent)]/80 text-sm font-medium hover:text-[var(--accent)] transition-colors font-[family-name:var(--font-inter)]"
                            >
                                <Play size={14} />
                                Explore the feed
                            </Link>
                        </div>
                    ) : (
                        <div
                            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                            style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                        >
                            {bookmarks.map((bookmark) => {
                                if (!bookmark.videoId) return null;

                                const video = bookmark.videoId;
                                const isHovered = hoveredReel === bookmark._id;

                                return (
                                    <div
                                        key={bookmark._id}
                                        className="group relative aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer"
                                        onMouseEnter={() => setHoveredReel(bookmark._id)}
                                        onMouseLeave={() => setHoveredReel(null)}
                                        onClick={() => handleOpenReel(video._id)}
                                    >
                                        { }
                                        <div
                                            className={`absolute inset-0 rounded-2xl transition-all duration-700 ease-out border border-white/5 ${isHovered
                                                ? 'shadow-[0_0_30px_var(--accent)]'
                                                : ''
                                                }`}
                                            style={{ borderColor: isHovered ? 'var(--accent)' : 'rgba(255,255,255,0.05)' }}
                                        />

                                        { }
                                        <div className={`absolute inset-0 bg-[var(--bg-card)] transition-opacity duration-700 ${isHovered ? 'opacity-100' : 'opacity-90'}`}>
                                            {isHovered ? (
                                                <video
                                                    ref={el => {
                                                        if (el) videoRefs.current.set(bookmark._id, el);
                                                    }}
                                                    src={video.videoUrl}
                                                    className="w-full h-full object-cover opacity-60"
                                                    muted
                                                    loop
                                                    playsInline
                                                />
                                            ) : (
                                                <img
                                                    src={getVideoThumbnail(video.videoUrl)}
                                                    alt=""
                                                    className="w-full h-full object-cover opacity-50"
                                                    onError={(e) => {

                                                        (e.target as HTMLImageElement).src = '/placeholder.jpg';
                                                    }}
                                                />
                                            )}
                                        </div>

                                        { }
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

                                        { }
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div
                                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${isHovered
                                                    ? 'bg-white/15 backdrop-blur-sm scale-100'
                                                    : 'bg-white/8 scale-95'
                                                    }`}
                                            >
                                                <Play
                                                    size={20}
                                                    className={`text-white ml-0.5 transition-all duration-500 ${isHovered ? 'opacity-90 fill-white/80' : 'opacity-50 fill-white/30'
                                                        }`}
                                                />
                                            </div>
                                        </div>

                                        { }
                                        {bookmark.revisitCount > 0 && (
                                            <div className="absolute top-3 right-3 text-[var(--accent)]/50 text-[10px] font-[family-name:var(--font-jetbrains-mono)]">
                                                {bookmark.revisitCount}×
                                            </div>
                                        )}

                                        { }
                                        <div className="absolute bottom-0 left-0 right-0 p-4">
                                            { }
                                            {video.uploadedBy && (
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-6 h-6 rounded-full p-[1px]" style={{ background: "var(--accent)" }}>
                                                        <div className="w-full h-full rounded-full bg-[var(--bg-main)] flex items-center justify-center">
                                                            <span className="text-[var(--text-main)]/80 text-[10px] font-medium">
                                                                {getInitial(video.uploadedBy.name || video.uploadedBy.email)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="text-[var(--text-main)]/70 text-xs font-medium font-[family-name:var(--font-inter)]">
                                                        {video.uploadedBy.name || video.uploadedBy.email?.split('@')[0]}
                                                    </span>
                                                </div>
                                            )}

                                            { }
                                            <p className="text-[var(--text-main)]/60 text-xs line-clamp-2 mb-2 font-[family-name:var(--font-inter)] leading-relaxed">
                                                {video.description || video.title}
                                            </p>

                                            { }
                                            <p className="text-[var(--text-muted)]/60 text-[10px] font-[family-name:var(--font-inter)]" suppressHydrationWarning>
                                                {formatSavedTime(bookmark.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                { }
                <div className="h-24" />
            </div>
        </main>
    );
}
