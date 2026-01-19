"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, UserPlus, UserCheck, ArrowLeft, Play, Grid, Film, Edit2, Sparkles, Lock } from "lucide-react";
import LeftSpine from "@/app/components/LeftSpine";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface UserProfile {
    _id: string;
    email: string;
    displayName: string;
    username?: string;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean; // Kept for legacy/simple checks
    followState: 'following' | 'requested' | 'not_following';
    isOwnProfile: boolean;
    isOnline: boolean;
    lastActive?: string;
    isPrivate: boolean;
}

interface UserVideo {
    _id: string;
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl: string;
    createdAt: string;
}

const VideoCard = ({ video, isHovered, onMouseEnter, onMouseLeave, setVideoRef }: {
    video: UserVideo;
    isHovered: boolean;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    setVideoRef: (id: string, el: HTMLVideoElement | null) => void;
}) => {
    return (
        <Link href={`/reel/${video._id}`} className="block relative aspect-[9/16] group rounded-xl overflow-hidden bg-black/40 border border-white/5 transition-transform duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-white/20 hover:z-10">
            {/* Thumbnail */}
            <img
                src={video.thumbnailUrl}
                alt={video.title}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isHovered ? 'opacity-0' : 'opacity-100'}`}
            />

            {/* Video Preview */}
            <video
                ref={(el) => setVideoRef(video._id, el)}
                src={video.videoUrl}
                muted
                loop
                playsInline
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Overlay Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-60'}`} />

            {/* Content info */}
            <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-white text-xs font-bold line-clamp-1 mb-0.5 text-shadow-sm">{video.title}</h3>
                <div className="flex items-center gap-2 text-[10px] text-white/70">
                    <span className="flex items-center gap-1">
                        <Play size={10} className="fill-white/70" />
                        {Math.floor(Math.random() * 1000) + 100} {/* Placeholder views */}
                    </span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
                </div>
            </div>

            {/* Hover Play Icon */}
            {!isHovered && (
                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Play className="w-3 h-3 text-white fill-white" />
                </div>
            )}
        </Link>
    );
};

export default function ProfilePage() {
    const { data: session } = useSession();
    const router = useRouter();
    const params = useParams();
    const userId = params?.userId as string;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [videos, setVideos] = useState<UserVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);
    const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);

    // Quick-preview refs
    const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

    useEffect(() => {
        if (userId) {
            fetchProfile();
            fetchVideos();
        }
    }, [userId, session?.user]);

    // Cleanup video refs
    useEffect(() => {
        return () => {
            videoRefs.current.forEach(video => {
                video.pause();
                video.removeAttribute('src'); // aggressive cleanup
                video.load();
            });
            videoRefs.current.clear();
        };
    }, []);

    // Handle hover preview
    useEffect(() => {
        const videoEl = hoveredVideo ? videoRefs.current.get(hoveredVideo) : null;

        if (videoEl) {
            const playPromise = videoEl.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Auto-play was prevented
                    console.log("Preview swipe prevented");
                });
            }
        }

        return () => {
            // Pause all others
            videoRefs.current.forEach((v, id) => {
                if (id !== hoveredVideo) {
                    v.pause();
                    v.currentTime = 0;
                }
            });
        };
    }, [hoveredVideo]);


    const fetchProfile = async () => {
        try {
            const res = await fetch(`/api/profile/${userId}/full`);
            if (res.ok) {
                const data = await res.json();
                setProfile(data.profile);
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        }
    };

    const fetchVideos = async () => {
        try {
            const res = await fetch(`/api/profile/${userId}/videos`);
            if (res.ok) {
                const data = await res.json();
                setVideos(data.videos);
            }
        } catch (error) {
            console.error("Failed to fetch videos", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        if (!profile) return;
        setFollowLoading(true);

        const currentState = profile.followState;
        let newState: 'following' | 'requested' | 'not_following' = 'not_following';

        // Determine next state (optimistic)
        if (currentState === 'following') {
            newState = 'not_following'; // Unfollow
        } else if (currentState === 'requested') {
            newState = 'not_following'; // Cancel request
        } else {
            // Follow or Request
            if (profile.isPrivate) {
                newState = 'requested';
            } else {
                newState = 'following';
            }
        }

        // Optimistic update
        setProfile(prev => prev ? ({
            ...prev,
            followState: newState,
            isFollowing: newState === 'following',
            followersCount: prev.followersCount + (newState === 'following' && currentState !== 'following' ? 1 : (newState !== 'following' && currentState === 'following' ? -1 : 0))
        }) : null);

        try {
            const method = newState === 'not_following' ? "DELETE" : "POST";
            const res = await fetch("/api/follow", {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetId: profile._id
                })
            });

            if (!res.ok) {
                // Revert
                setProfile(prev => prev ? ({
                    ...prev,
                    followState: currentState,
                    isFollowing: currentState === 'following',
                    followersCount: prev.followersCount // Simplistic revert, ideally calc diff
                }) : null);
                // Ideally fetch profile to sync
                fetchProfile();
            } else {
                const data = await res.json();
                // Sync server state if provided
                if (data.status) {
                    setProfile(prev => prev ? ({
                        ...prev,
                        followState: data.status as any,
                        isFollowing: data.status === 'following'
                    }) : null);
                }
            }
        } catch (error) {
            console.error("Follow action failed", error);
            // Revert
            fetchProfile();
        } finally {
            setFollowLoading(false);
        }
    };

    const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : "U";

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#4F8CFF] animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-[#0F1117] flex items-center justify-center text-white">
                User not found
            </div>
        );
    }

    const bannerImage = profile.bannerUrl || null;
    const showPrivateState = profile.isPrivate && !profile.isFollowing && !profile.isOwnProfile;

    return (
        <main className="min-h-screen bg-[#0F1117]">
            <LeftSpine onAvatarClick={() => { }} />

            <div className="pl-0 md:pl-20 min-h-screen pb-24">
                {/* Banner & Header */}
                <div className="relative h-56 w-full overflow-hidden">
                    {/* Banner Image */}
                    {bannerImage ? (
                        <>
                            <img
                                src={bannerImage}
                                alt="Banner"
                                className="w-full h-full object-cover blur-md scale-105 opacity-60"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0F1117]/50 to-[#0F1117]" />
                        </>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#4F8CFF]/20 to-[#2DE2A6]/20" />
                    )}

                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="absolute top-4 left-4 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all z-10"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    {/* Decorative overlay */}
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
                </div>

                <div className="max-w-4xl mx-auto px-6 relative z-10 -mt-20">
                    {/* Avatar & Info */}
                    <div className="flex flex-col items-center text-center">
                        {/* Avatar */}
                        <div className="relative mb-4 group cursor-pointer transition-transform duration-300 hover:scale-105">
                            <div className={`w-36 h-36 rounded-full p-[4px] ${profile.isOnline
                                ? 'bg-gradient-to-br from-[#2DE2A6] to-[#4F8CFF] animate-pulse-slow'
                                : 'bg-gradient-to-br from-[#4F8CFF]/50 to-[#2DE2A6]/50'
                                } shadow-[0_8px_32px_rgba(0,0,0,0.5)]`}>
                                <div className="w-full h-full rounded-full bg-[#0F1117] overflow-hidden flex items-center justify-center border-4 border-[#0F1117]">
                                    {profile.avatarUrl ? (
                                        <img
                                            src={profile.avatarUrl}
                                            alt={profile.displayName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-4xl text-white font-[family-name:var(--font-space-grotesk)]">
                                            {getInitial(profile.displayName)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {profile.isOnline && (
                                <div className="absolute bottom-3 right-3 w-6 h-6 bg-[#2DE2A6] rounded-full border-4 border-[#0F1117] shadow-[0_0_12px_#2DE2A6]" />
                            )}
                        </div>

                        {/* Identity Cluster */}
                        <div className="flex flex-col items-center mb-8 w-full max-w-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-3xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
                                    {profile.displayName}
                                </h1>
                            </div>

                            {profile.username && (
                                <p className="text-[#5C6270] font-[family-name:var(--font-jetbrains-mono)] mb-3 flex items-center gap-1.5">
                                    <span className="text-[#4F8CFF]">@</span>{profile.username}
                                </p>
                            )}

                            {/* Bio */}
                            <p className="text-white/80 text-sm font-[family-name:var(--font-inter)] leading-relaxed max-w-md mx-auto mb-6 line-clamp-3">
                                {profile.bio || "This user hasn't written a bio yet."}
                            </p>

                            {/* Action Button */}
                            {!profile.isOwnProfile ? (
                                <button
                                    onClick={handleFollowToggle}
                                    disabled={followLoading || profile.followState === 'requested'}
                                    className={`flex items-center justify-center gap-2 px-8 py-2.5 rounded-full font-medium transition-all transform active:scale-95 disabled:opacity-70 min-w-[140px] ${profile.followState === 'following'
                                        ? 'bg-white/5 text-white hover:bg-red-500/10 hover:text-red-400 border border-white/10 hover:border-red-500/30'
                                        : profile.followState === 'requested'
                                            ? 'bg-white/10 text-white/70 border border-white/10 cursor-not-allowed'
                                            : 'bg-[#4F8CFF] text-white hover:bg-[#3D7AFF] shadow-[0_4px_16px_rgba(79,140,255,0.3)]'
                                        }`}
                                >
                                    {followLoading && profile.followState !== 'requested' ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : profile.followState === 'following' ? (
                                        <>
                                            <UserCheck size={18} />
                                            <span>Following</span>
                                        </>
                                    ) : profile.followState === 'requested' ? (
                                        <>
                                            <Loader2 size={18} className="animate-pulse" /> {/* Or a clock icon */}
                                            <span>Requested</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={18} />
                                            <span>Follow</span>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <Link
                                    href="/settings/profile"
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-all font-medium text-sm"
                                >
                                    <Edit2 size={16} />
                                    Edit Profile
                                </Link>
                            )}
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center justify-center gap-12 mb-10 border-t border-b border-white/5 py-4 w-full max-w-md bg-white/5 rounded-2xl backdrop-blur-sm">
                            <div className="text-center group cursor-pointer">
                                <p className="text-xl font-bold text-white font-[family-name:var(--font-space-grotesk)] group-hover:text-[#4F8CFF] transition-colors">
                                    {profile.followersCount}
                                </p>
                                <p className="text-[#5C6270] text-xs font-medium uppercase tracking-wider mt-1">Followers</p>
                            </div>
                            <div className="text-center group cursor-pointer">
                                <p className="text-xl font-bold text-white font-[family-name:var(--font-space-grotesk)] group-hover:text-[#4F8CFF] transition-colors">
                                    {profile.followingCount}
                                </p>
                                <p className="text-[#5C6270] text-xs font-medium uppercase tracking-wider mt-1">Following</p>
                            </div>
                            <div className="text-center group cursor-pointer">
                                <p className="text-xl font-bold text-white font-[family-name:var(--font-space-grotesk)] group-hover:text-[#4F8CFF] transition-colors">
                                    {videos.length}
                                </p>
                                <p className="text-[#5C6270] text-xs font-medium uppercase tracking-wider mt-1">Reels</p>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="w-full">
                            <div className="flex items-center justify-center gap-2 mb-6 opacity-60">
                                <Film size={16} className="text-white" />
                                <span className="text-xs font-medium text-white uppercase tracking-widest">Reels</span>
                            </div>

                            {showPrivateState ? (
                                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                                        <Lock size={32} className="text-[#5C6270]" />
                                    </div>
                                    <h3 className="text-white font-medium mb-1 text-lg">This Account is Private</h3>
                                    <p className="text-[#5C6270] text-sm">Follow to see their photos and videos.</p>
                                </div>
                            ) : videos.length === 0 ? (
                                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5">
                                    <Sparkles className="w-12 h-12 text-[#5C6270]/40 mx-auto mb-4" />
                                    <h3 className="text-white font-medium mb-1">This is the beginning of their story.</h3>
                                    <p className="text-[#5C6270] text-sm">No reels uploaded yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {videos.map(video => (
                                        <VideoCard
                                            key={video._id}
                                            video={video}
                                            isHovered={hoveredVideo === video._id}
                                            onMouseEnter={() => setHoveredVideo(video._id)}
                                            onMouseLeave={() => setHoveredVideo(null)}
                                            setVideoRef={(id, el) => {
                                                if (el) videoRefs.current.set(id, el);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
