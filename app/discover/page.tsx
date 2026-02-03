"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, UserCheck, Eye, Sparkles, TrendingUp, Zap, MapPin } from "lucide-react";
import LeftSpine from "@/app/components/LeftSpine";
import Link from "next/link";

interface DiscoverUser {
    _id: string;
    displayName: string;
    username?: string;
    bio: string;
    avatarUrl?: string;
    followersCount: number;
    followingCount: number;
    lastActive?: string; 
    isFollowing: boolean;
    previewVideoUrl?: string;
    previewThumbnailUrl?: string;
}

interface DiscoverySeam {
    position: number;
    type: string;
    text: string;
}

type FilterMode = 'trending' | 'rising' | 'nearby' | 'new';

const filterModes: { id: FilterMode; label: string; icon: any; apiMode: string }[] = [
    { id: 'trending', label: 'Trending', icon: TrendingUp, apiMode: 'trending' },
    { id: 'rising', label: 'Rising', icon: TrendingUp, apiMode: 'rising' },
    { id: 'nearby', label: 'Nearby', icon: MapPin, apiMode: 'active' }, 
    { id: 'new', label: 'New Voices', icon: Sparkles, apiMode: 'new' },
];

export default function DiscoverPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<DiscoverUser[]>([]);
    const [seams, setSeams] = useState<DiscoverySeam[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeMode, setActiveMode] = useState<FilterMode>('trending');
    const [hoveredUser, setHoveredUser] = useState<string | null>(null);
    const [followingInProgress, setFollowingInProgress] = useState<Set<string>>(new Set());
    const [exitAnimations, setExitAnimations] = useState<Set<string>>(new Set());
    const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

    useEffect(() => {
        const fetchDiscover = async () => {
            setLoading(true);
            try {
                
                const apiMode = filterModes.find(m => m.id === activeMode)?.apiMode || 'trending';
                const res = await fetch(`/api/discover?mode=${apiMode}`);
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users || []);
                    setSeams(data.seams || []);
                }
            } catch (error) {
                console.error('Error fetching discover:', error);
            } finally {
                setLoading(false);
            }
        };

        if (session) {
            fetchDiscover();
        }
    }, [session, activeMode]);

    useEffect(() => {
        if (hoveredUser) {
            const video = videoRefs.current.get(hoveredUser);
            if (video) {
                video.play().catch(() => { });
            }
        }
        
        videoRefs.current.forEach((video, id) => {
            if (id !== hoveredUser) {
                video.pause();
                video.currentTime = 0;
            }
        });
    }, [hoveredUser]);

    const handleFollow = async (userId: string, isCurrentlyFollowing: boolean) => {
        
        const isFollowingAction = !isCurrentlyFollowing;

        setFollowingInProgress(prev => new Set(prev).add(userId));

        try {
            const res = await fetch('/api/follow', {
                method: isFollowingAction ? 'POST' : 'DELETE', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId: userId })
            });

            if (res.ok) {
                if (isFollowingAction) {
                    
                    setExitAnimations(prev => new Set(prev).add(userId));

                    setTimeout(() => {
                        setUsers(prev => prev.filter(u => u._id !== userId));

                    }, 500);
                } else {
                    
                    setUsers(prev => prev.map(u => u._id === userId ? { ...u, isFollowing: false } : u));
                }
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        } finally {
            setFollowingInProgress(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        }
    };

    const getInitial = (name: string) => {
        return name?.charAt(0)?.toUpperCase() || '?';
    };

    const formatFollowers = (count: number) => {
        
        if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
        if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
        return count.toString();
    };

    const getPresenceStatus = (lastActive?: string) => {
        if (!lastActive) return 'offline';
        const diff = Date.now() - new Date(lastActive).getTime();
        if (diff < 5 * 60 * 1000) return 'online'; 
        if (diff < 24 * 60 * 60 * 1000) return 'active'; 
        return 'offline';
    };

    const getDisplayItems = () => {
        const items: (DiscoverUser | DiscoverySeam)[] = [];
        let seamIndex = 0;

        users.forEach((user, index) => {
            
            while (seamIndex < seams.length && seams[seamIndex].position === index) {
                items.push(seams[seamIndex]);
                seamIndex++;
            }
            items.push(user);
        });

        return items;
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    if (status === "unauthenticated") {
        router.push("/login");
        return null;
    }

    const displayItems = getDisplayItems();

    return (
        <main className="min-h-screen bg-[var(--bg-main)] overflow-hidden">
            <LeftSpine onAvatarClick={() => { }} />

            {}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--accent)]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--accent)]/5 rounded-full blur-3xl" />
            </div>

            <div className="pl-20 pr-8 py-8 relative">
                {}
                <div className="max-w-7xl mx-auto mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--text-main)] mb-1 font-[family-name:var(--font-space-grotesk)]">
                                Discover
                            </h1>
                            <p className="text-[var(--text-muted)] font-[family-name:var(--font-inter)] text-sm">
                                Find people, not just content
                            </p>
                        </div>

                        {}
                        <div className="flex gap-1 bg-[var(--bg-card)]/80 backdrop-blur-md p-1.5 rounded-full border border-[var(--border-soft)] overflow-x-auto no-scrollbar">
                            {filterModes.map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => setActiveMode(mode.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-[family-name:var(--font-inter)] text-sm whitespace-nowrap ${activeMode === mode.id
                                        ? 'bg-[var(--accent)] text-[#0F1117] shadow-lg'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                        }`}
                                >
                                    <mode.icon size={14} />
                                    <span>{mode.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {}
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="flex justify-center py-24">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
                                <p className="text-[var(--text-muted)] text-sm font-[family-name:var(--font-inter)]">
                                    Scanning the network...
                                </p>
                            </div>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-24">
                            <Sparkles className="w-16 h-16 text-[var(--text-disabled)]/30 mx-auto mb-4" />
                            <p className="text-[var(--text-muted)] font-[family-name:var(--font-inter)]">
                                The void is silent here. Try another frequency.
                            </p>
                        </div>
                    ) : (
                        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                            {displayItems.map((item, index) => {
                                
                                if ('type' in item && item.type === 'insight') {
                                    return (
                                        <div
                                            key={`seam-${index}`}
                                            className="break-inside-avoid col-span-full w-full py-6"
                                        >
                                            <div className="flex items-center gap-4 opacity-50">
                                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/30 to-transparent" />
                                                <p className="text-[var(--text-disabled)] text-xs font-[family-name:var(--font-jetbrains-mono)] uppercase tracking-wider">
                                                    {item.text}
                                                </p>
                                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/30 to-transparent" />
                                            </div>
                                        </div>
                                    );
                                }

                                const user = item as DiscoverUser;
                                const isHovered = hoveredUser === user._id;
                                const isHighlight = index > 0 && index % 5 === 0; 
                                const presence = getPresenceStatus(user.lastActive);
                                const isExiting = exitAnimations.has(user._id);

                                return (
                                    <div
                                        key={user._id}
                                        className={`break-inside-avoid relative group cursor-pointer transition-all duration-500 ease-out
                                            ${isHighlight ? 'min-h-[360px]' : 'min-h-[280px]'}
                                            ${isExiting ? 'opacity-0 -translate-y-20 scale-95 pointer-events-none' : 'opacity-100 translate-y-0 scale-100'}
                                        `}
                                        onMouseEnter={() => setHoveredUser(user._id)}
                                        onMouseLeave={() => setHoveredUser(null)}
                                        onClick={() => router.push(`/profile/${user._id}`)}
                                    >
                                        {}
                                        <div
                                            className={`relative h-full rounded-[24px] overflow-hidden transition-all duration-500 border ${isHovered
                                                ? 'bg-[var(--bg-card)] translate-y-[-4px]'
                                                : 'bg-[var(--bg-card)]/40 border-[var(--border-soft)] backdrop-blur-sm'
                                                }`}
                                            style={{
                                                borderColor: isHovered ? 'var(--accent)' : 'var(--border-soft)',
                                                boxShadow: isHovered ? '0 12px 40px var(--accent-glow, rgba(0,0,0,0.2))' : 'none'
                                            }}
                                        >

                                            {}
                                            {isHighlight && user.previewVideoUrl && (
                                                <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700">
                                                    <video
                                                        src={user.previewVideoUrl}
                                                        className="w-full h-full object-cover blur-xl scale-110"
                                                        muted
                                                        loop
                                                        autoPlay
                                                        playsInline
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-card)]/80 via-[var(--bg-card)]/50 to-[var(--bg-card)]" />
                                                </div>
                                            )}

                                            {}
                                            {user.previewVideoUrl && (
                                                <div className={`absolute inset-0 transition-opacity duration-500 ${isHovered && !isHighlight ? 'opacity-20' : 'opacity-0'}`}>
                                                    <video
                                                        ref={el => {
                                                            if (el) videoRefs.current.set(user._id, el);
                                                        }}
                                                        src={user.previewVideoUrl}
                                                        className="w-full h-full object-cover"
                                                        muted
                                                        loop
                                                        playsInline
                                                    />
                                                </div>
                                            )}

                                            {}
                                            <div className="relative z-10 px-6 py-8 flex flex-col items-center text-center h-full">

                                                {}
                                                <div className="relative mb-3">
                                                    <div className={`rounded-full p-[2px] transition-all duration-500`} style={{ background: isHovered ? "var(--accent)" : "var(--accent)" }}>
                                                        <div className={`rounded-full bg-[var(--bg-card)] overflow-hidden flex items-center justify-center ${isHighlight ? 'w-[72px] h-[72px]' : 'w-[64px] h-[64px]'}`}>
                                                            {user.avatarUrl ? (
                                                                <img
                                                                    src={user.avatarUrl}
                                                                    alt={user.displayName}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="text-xl text-[var(--text-main)] font-[family-name:var(--font-space-grotesk)]">
                                                                    {getInitial(user.displayName)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {}
                                                    {presence !== 'offline' && (
                                                        <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-[3px] border-[var(--bg-card)] ${presence === 'online' ? 'animate-pulse' : ''}`} style={{ backgroundColor: "var(--accent)" }} />
                                                    )}
                                                </div>

                                                {}
                                                <h3 className="text-[var(--text-main)] font-bold text-lg font-[family-name:var(--font-space-grotesk)] leading-tight">
                                                    {user.displayName}
                                                </h3>

                                                {}
                                                {user.bio ? (
                                                    <p className="text-[var(--text-muted)] text-xs font-[family-name:var(--font-inter)] line-clamp-2 mt-1 mb-4 max-w-[90%]">
                                                        {user.bio}
                                                    </p>
                                                ) : (
                                                    <div className="h-4 mb-4" /> 
                                                )}

                                                {}
                                                <div className="mt-auto mb-4 bg-[var(--bg-main)]/50 rounded-full px-3 py-1 border border-[var(--border-soft)]">
                                                    <p className="text-[var(--accent)] text-xs font-medium font-[family-name:var(--font-inter)]">
                                                        {formatFollowers(user.followersCount)} followers
                                                    </p>
                                                </div>

                                                {}
                                                {activeMode !== 'trending' && ' '} {}
                                            </div>

                                            {}
                                            <div className={`absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[var(--bg-card)] to-transparent pt-12 flex items-center justify-center gap-2 transition-all duration-300 transform ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFollow(user._id, user.isFollowing);
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-2 h-9 rounded-full text-[#0F1117] text-xs font-bold hover:brightness-110 active:scale-95 transition-all"
                                                    style={{ background: "var(--accent)" }}
                                                >
                                                    {user.isFollowing ? (
                                                        <>
                                                            <UserCheck size={14} />
                                                            Following
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles size={14} />
                                                            Follow
                                                        </>
                                                    )}
                                                </button>

                                                <Link
                                                    href={`/profile/${user._id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-sm"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {}
                <div className="h-24" />
            </div>
        </main>
    );
}
