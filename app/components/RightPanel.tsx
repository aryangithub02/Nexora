"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { LogOut, Settings, Edit } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface RightPanelProps {
    profileMode?: boolean;
    toggleProfileMode?: () => void;
}

interface LiveUser {
    _id: string;
    displayName: string;
    username?: string;
    avatarUrl?: string;
    currentActivity: {
        type: 'watching' | 'uploading' | 'idle';
    };
    isActive: boolean;
}

interface SuggestedUser {
    _id: string;
    displayName: string;
    username?: string;
    avatarUrl?: string;
    followersCount?: number;
}

interface UserProfile {
    avatarUrl?: string;
    displayName?: string;
    username?: string;
}

export default function RightPanel({ profileMode = false, toggleProfileMode }: RightPanelProps) {
    const { data: session } = useSession();
    const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);
    const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
    const [hoveredUser, setHoveredUser] = useState<string | null>(null);
    const [followingInProgress, setFollowingInProgress] = useState<Set<string>>(new Set());
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

    const getInitial = (email: string | null | undefined) => {
        if (!email) return "?";
        return email.charAt(0).toUpperCase();
    };

    // Fetch current user's profile for avatar
    useEffect(() => {
        const fetchCurrentUserProfile = async () => {
            if (!session?.user) return;
            try {
                const res = await fetch('/api/settings/profile');
                if (res.ok) {
                    const data = await res.json();
                    setCurrentUserProfile(data.profile);
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        };
        fetchCurrentUserProfile();
    }, [session]);

    // Fetch live users and suggested users
    useEffect(() => {
        const fetchRadarData = async () => {
            try {
                const [liveRes, suggestedRes] = await Promise.all([
                    fetch('/api/radar/live'),
                    fetch('/api/radar/suggested')
                ]);

                if (liveRes.ok) {
                    const liveData = await liveRes.json();
                    setLiveUsers(liveData.users || []);
                }

                if (suggestedRes.ok) {
                    const suggestedData = await suggestedRes.json();
                    setSuggestedUsers(suggestedData.suggestions || []);
                }
            } catch (error) {
                console.error('Error fetching radar data:', error);
            }
        };

        if (session) {
            fetchRadarData();
            // Refresh every 30 seconds
            const interval = setInterval(fetchRadarData, 30000);
            return () => clearInterval(interval);
        }
    }, [session]);

    // Send activity heartbeat
    useEffect(() => {
        const sendHeartbeat = async () => {
            try {
                await fetch('/api/radar/activity', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        activity: { type: 'idle', timestamp: new Date() }
                    })
                });
            } catch (error) {
                console.error('Error sending heartbeat:', error);
            }
        };

        if (session) {
            sendHeartbeat();
            const interval = setInterval(sendHeartbeat, 60000); // Every minute
            return () => clearInterval(interval);
        }
    }, [session]);

    const handleFollow = async (userId: string) => {
        setFollowingInProgress(prev => new Set(prev).add(userId));

        try {
            const res = await fetch('/api/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId: userId })
            });

            if (res.ok) {
                // Remove from suggested with upward dissolve animation
                setSuggestedUsers(prev => prev.filter(u => u._id !== userId));

                // Refresh live radar to potentially show the new follow
                const liveRes = await fetch('/api/radar/live');
                if (liveRes.ok) {
                    const liveData = await liveRes.json();
                    setLiveUsers(liveData.users || []);
                }
            }
        } catch (error) {
            console.error('Error following user:', error);
        } finally {
            setFollowingInProgress(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        }
    };

    if (profileMode) {
        return (
            <aside className="fixed right-0 top-0 h-screen w-[300px] bg-[var(--glass)] backdrop-blur-md border-l border-[var(--border-soft)] p-6 z-40 animate-in slide-in-from-right duration-300">
                <div className="flex flex-col items-center pt-10">
                    <div className="w-24 h-24 rounded-full p-[2px] mb-4" style={{ background: "var(--accent)" }}>
                        <div className="w-full h-full rounded-full bg-[var(--bg-main)] flex items-center justify-center overflow-hidden">
                            {currentUserProfile?.avatarUrl ? (
                                <Image
                                    src={currentUserProfile.avatarUrl}
                                    alt="Profile"
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover rounded-full"
                                />
                            ) : (
                                <span className="text-3xl text-white font-[family-name:var(--font-space-grotesk)]">
                                    {getInitial(session?.user?.email)}
                                </span>
                            )}
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-[var(--text-main)] mb-1 font-[family-name:var(--font-space-grotesk)]">
                        {currentUserProfile?.displayName || session?.user?.email?.split('@')[0]}
                    </h2>
                    <p className="text-sm text-[var(--text-muted)] font-[family-name:var(--font-jetbrains-mono)] mb-8">
                        @{currentUserProfile?.username || session?.user?.email?.split('@')[0]}
                    </p>

                    <div className="w-full space-y-2">
                        <Link href="/settings/profile" className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all">
                            <Edit size={18} />
                            <span>Edit Profile</span>
                        </Link>
                        <Link href="/settings" className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all">
                            <Settings size={18} />
                            <span>Settings</span>
                        </Link>
                        <button
                            onClick={() => signOut()}
                            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 text-[#FF6B6B] hover:text-[#FF8B8B] transition-all"
                        >
                            <LogOut size={18} />
                            <span>Sign Out</span>
                        </button>
                    </div>

                    <button
                        onClick={toggleProfileMode}
                        className="mt-auto text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                    >
                        ← Back to Radar
                    </button>
                </div>
            </aside>
        )
    }

    return (
        <aside className="fixed right-0 top-0 h-screen w-[320px] bg-transparent p-6 pl-8 hidden xl:block overflow-y-auto scrollbar-hide">
            {/* User Card */}
            <div
                onClick={toggleProfileMode}
                className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-soft)] hover:border-[#4F8CFF]/30 cursor-pointer transition-all mb-8 group"
            >
                <div className="w-12 h-12 rounded-full p-[2px] relative" style={{ background: "var(--accent)" }}>
                    {/* Breathing accent ring */}
                    <div className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-20 animate-pulse" />
                    <div className="w-full h-full rounded-full bg-[var(--bg-main)] flex items-center justify-center relative z-10 overflow-hidden">
                        {currentUserProfile?.avatarUrl ? (
                            <Image
                                src={currentUserProfile.avatarUrl}
                                alt="Profile"
                                width={48}
                                height={48}
                                className="w-full h-full object-cover rounded-full"
                            />
                        ) : (
                            <span className="text-white font-[family-name:var(--font-space-grotesk)]">
                                {getInitial(session?.user?.email)}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[var(--text-main)] truncate font-[family-name:var(--font-space-grotesk)] group-hover:text-[#4F8CFF] transition-colors">
                        {currentUserProfile?.displayName || session?.user?.email?.split('@')[0]}
                    </h3>
                    <p className="text-xs text-[var(--accent)] truncate font-[family-name:var(--font-jetbrains-mono)] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                        Online
                    </p>
                </div>
            </div>

            {/* Dynamic Panels */}
            <div className="space-y-8">
                {/* Live Radar */}
                <section>
                    <h4 className="text-xs font-bold text-[var(--text-disabled)] uppercase tracking-wider mb-4 font-[family-name:var(--font-jetbrains-mono)]">
                        Live Radar
                    </h4>
                    <div className="flex -space-x-2 py-2 relative">
                        {liveUsers.length === 0 ? (
                            <div className="py-4 px-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-soft)]">
                                <p className="text-sm text-[var(--text-muted)] mb-1" style={{ fontFamily: "var(--font-inter)" }}>Your network is quiet.</p>
                                <p className="text-xs text-[var(--accent)]" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>Explore Discover to wake it up →</p>
                            </div>
                        ) : (
                            <>
                                {liveUsers.slice(0, 5).map((user, index) => (
                                    <div
                                        key={user._id}
                                        className="relative group cursor-pointer z-10"
                                        onMouseEnter={() => setHoveredUser(user._id)}
                                        onMouseLeave={() => setHoveredUser(null)}
                                        style={{
                                            animation: `ghostPulse 8s ease-in-out infinite`,
                                            animationDelay: `${index * 1.5}s`
                                        }}
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-full border-2 bg-[var(--bg-card)] flex items-center justify-center text-xs text-[var(--text-muted)] overflow-hidden transition-all`}
                                            style={{
                                                borderColor: user.isActive ? 'var(--accent)' : 'var(--bg-main)',
                                                boxShadow: user.isActive ? '0 0 12px var(--accent)' : 'none'
                                            }}
                                        >
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{user.displayName[0]}</span>
                                            )}
                                        </div>

                                        {/* Hover tooltip */}
                                        {hoveredUser === user._id && (
                                            <div className="absolute left-0 top-full mt-2 bg-[var(--bg-card)]/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[var(--border-soft)] whitespace-nowrap z-[100] animate-in fade-in slide-in-from-top-2 duration-200 shadow-[var(--shadow-soft)] pointer-events-none min-w-[140px]">
                                                {user.username ? (
                                                    <>
                                                        <p className="text-sm text-[var(--text-main)] font-bold font-[family-name:var(--font-space-grotesk)]">
                                                            @{user.username}
                                                        </p>
                                                        {user.displayName !== user.username && (
                                                            <p className="text-[10px] text-[var(--text-muted)] font-[family-name:var(--font-inter)]">
                                                                {user.displayName}
                                                            </p>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p className="text-sm text-white font-bold font-[family-name:var(--font-space-grotesk)]">
                                                        {user.displayName}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-[var(--accent)] flex items-center gap-1.5 mt-1 font-[family-name:var(--font-jetbrains-mono)]">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                                                    {user.currentActivity.type === 'watching' ? 'Watching now' :
                                                        user.currentActivity.type === 'uploading' ? 'Uploading...' :
                                                            'Online'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {liveUsers.length > 5 && (
                                    <div className="w-10 h-10 rounded-full border-2 border-[var(--bg-main)] bg-[var(--bg-card)] flex items-center justify-center text-[10px] text-[var(--accent)] font-mono">
                                        +{liveUsers.length - 5}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>

                {/* Suggested */}
                <section>
                    <h4 className="text-xs font-bold text-[var(--text-disabled)] uppercase tracking-wider mb-4 font-[family-name:var(--font-jetbrains-mono)]">
                        Suggested
                    </h4>
                    <div className="space-y-3">
                        {suggestedUsers.length === 0 ? (
                            <div className="py-4 px-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-soft)]">
                                <p className="text-sm text-[var(--text-muted)] mb-1" style={{ fontFamily: "var(--font-inter)" }}>You haven't followed enough creators yet.</p>
                                <p className="text-xs text-[var(--accent)]" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>Follow more to unlock suggestions →</p>
                            </div>
                        ) : (
                            suggestedUsers.map(user => (
                                <div
                                    key={user._id}
                                    className="flex items-center justify-between group animate-in slide-in-from-bottom duration-500"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full p-[1px] overflow-hidden" style={{ background: "var(--accent)" }}>
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                <div className="w-full h-full rounded-full bg-[var(--bg-card)] flex items-center justify-center text-xs text-[var(--text-muted)]">
                                                    {user.displayName[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-[var(--text-muted)] font-[family-name:var(--font-inter)] font-medium">
                                                {user.displayName}
                                            </span>
                                            <span className="text-[10px] text-[var(--text-disabled)]">Suggested for you</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleFollow(user._id)}
                                        disabled={followingInProgress.has(user._id)}
                                        className="text-xs text-[var(--accent)] hover:text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-105 disabled:opacity-50 px-3 py-1 rounded-full border border-[var(--accent)]/30 hover:border-[var(--accent)] disabled:cursor-not-allowed"
                                    >
                                        {followingInProgress.has(user._id) ? 'Following...' : 'Follow'}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

        </aside>
    );
}
