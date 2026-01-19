"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, UserPlus, Compass, Search, UserCheck, Loader2 } from "lucide-react";
import LeftSpine from "@/app/components/LeftSpine";

interface NetworkUser {
    _id: string;
    displayName: string;
    username?: string;
    bio?: string;
    avatarUrl?: string;
    followersCount: number;
    followingCount: number;
    isFollowingBack?: boolean;
    isOnline?: boolean;
}

type TabType = 'following' | 'followers' | 'discover';

export default function NetworkPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('following');
    const [users, setUsers] = useState<NetworkUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [followingInProgress, setFollowingInProgress] = useState<Set<string>>(new Set());
    const [stats, setStats] = useState({ followers: 0, following: 0 });

    // Fetch network data
    useEffect(() => {
        const fetchNetwork = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/network?type=${activeTab}`);
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users || []);
                    if (activeTab === 'following') {
                        setStats(prev => ({ ...prev, following: data.total }));
                    } else if (activeTab === 'followers') {
                        setStats(prev => ({ ...prev, followers: data.total }));
                    }
                }
            } catch (error) {
                console.error('Error fetching network:', error);
            } finally {
                setLoading(false);
            }
        };

        if (session) {
            fetchNetwork();
        }
    }, [session, activeTab]);

    // Fetch stats on mount
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [followersRes, followingRes] = await Promise.all([
                    fetch('/api/network?type=followers&limit=1'),
                    fetch('/api/network?type=following&limit=1')
                ]);
                if (followersRes.ok) {
                    const data = await followersRes.json();
                    setStats(prev => ({ ...prev, followers: data.total }));
                }
                if (followingRes.ok) {
                    const data = await followingRes.json();
                    setStats(prev => ({ ...prev, following: data.total }));
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        if (session) {
            fetchStats();
        }
    }, [session]);

    const handleFollow = async (userId: string, isCurrentlyFollowing: boolean) => {
        setFollowingInProgress(prev => new Set(prev).add(userId));

        try {
            const res = await fetch('/api/follow', {
                method: isCurrentlyFollowing ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId: userId })
            });

            if (res.ok) {
                if (activeTab === 'discover') {
                    // Remove from discover list after following
                    setUsers(prev => prev.filter(u => u._id !== userId));
                } else if (activeTab === 'followers') {
                    // Update follow back status
                    setUsers(prev => prev.map(u =>
                        u._id === userId ? { ...u, isFollowingBack: !isCurrentlyFollowing } : u
                    ));
                } else if (activeTab === 'following' && isCurrentlyFollowing) {
                    // Remove from following list after unfollowing
                    setUsers(prev => prev.filter(u => u._id !== userId));
                    setStats(prev => ({ ...prev, following: prev.following - 1 }));
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

    const filteredUsers = users.filter(user =>
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getInitial = (name: string) => {
        return name?.charAt(0)?.toUpperCase() || '?';
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

    const tabs: { id: TabType; label: string; icon: any; count?: number }[] = [
        { id: 'following', label: 'Following', icon: Users, count: stats.following },
        { id: 'followers', label: 'Followers', icon: UserPlus, count: stats.followers },
        { id: 'discover', label: 'Discover', icon: Compass },
    ];

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <LeftSpine onAvatarClick={() => { }} />

            <div className="pl-20 pr-8 py-8">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2 font-[family-name:var(--font-space-grotesk)]">
                            Your Network
                        </h1>
                        <p className="text-[var(--text-muted)] font-[family-name:var(--font-inter)]">
                            Connect with creators and grow your community
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-[var(--bg-card)]/50 rounded-2xl p-6 border border-[var(--border-soft)]">
                            <p className="text-4xl font-bold text-[var(--text-main)] font-[family-name:var(--font-space-grotesk)]">
                                {stats.following}
                            </p>
                            <p className="text-[var(--text-muted)] text-sm">Following</p>
                        </div>
                        <div className="bg-[var(--bg-card)]/50 rounded-2xl p-6 border border-[var(--border-soft)]">
                            <p className="text-4xl font-bold text-[var(--text-main)] font-[family-name:var(--font-space-grotesk)]">
                                {stats.followers}
                            </p>
                            <p className="text-[var(--text-muted)] text-sm">Followers</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all font-[family-name:var(--font-inter)] ${activeTab === tab.id
                                    ? 'bg-[var(--accent)] text-[#0F1117]'
                                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
                                    }`}
                            >
                                <tab.icon size={16} />
                                <span>{tab.label}</span>
                                {tab.count !== undefined && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-[var(--bg-main)]'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50 transition-all font-[family-name:var(--font-inter)]"
                        />
                    </div>

                    {/* User List */}
                    <div className="space-y-3">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-[var(--text-muted)] font-[family-name:var(--font-inter)]">
                                    {activeTab === 'discover'
                                        ? 'No new users to discover'
                                        : activeTab === 'followers'
                                            ? 'No followers yet'
                                            : 'Not following anyone yet'}
                                </p>
                            </div>
                        ) : (
                            filteredUsers.map(user => (
                                <div
                                    key={user._id}
                                    className="flex items-center gap-4 p-4 bg-[var(--bg-card)]/50 rounded-2xl border border-[var(--border-soft)] hover:border-[var(--accent)]/20 transition-all group"
                                >
                                    {/* User Info Link */}
                                    <Link
                                        href={`/profile/${user._id}`}
                                        className="flex-1 flex gap-4 min-w-0 group-hover:opacity-100"
                                    >
                                        {/* Avatar */}
                                        <div className="relative flex-shrink-0">
                                            <div className="w-14 h-14 rounded-full p-[2px]" style={{ background: "var(--accent)" }}>
                                                <div className="w-full h-full rounded-full bg-[var(--bg-main)] overflow-hidden flex items-center justify-center">
                                                    {user.avatarUrl ? (
                                                        <img
                                                            src={user.avatarUrl}
                                                            alt={user.displayName}
                                                            className="w-full h-full object-cover"
                                                            style={{ minWidth: '100%', minHeight: '100%' }}
                                                        />
                                                    ) : (
                                                        <span className="text-lg text-[var(--text-main)] font-[family-name:var(--font-space-grotesk)]">
                                                            {getInitial(user.displayName)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {user.isOnline && (
                                                <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[var(--bg-main)]" style={{ backgroundColor: "var(--accent)" }} />
                                            )}
                                        </div>

                                        {/* User Info Text */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-[var(--text-main)] font-semibold truncate font-[family-name:var(--font-space-grotesk)] group-hover:text-[var(--accent)] transition-colors">
                                                    {user.displayName}
                                                </h3>
                                                {user.username && (
                                                    <span className="text-[var(--text-muted)] text-sm font-[family-name:var(--font-jetbrains-mono)]">
                                                        @{user.username}
                                                    </span>
                                                )}
                                            </div>
                                            {user.bio && (
                                                <p className="text-[var(--text-muted)] text-sm truncate font-[family-name:var(--font-inter)]">
                                                    {user.bio}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 mt-1 text-xs text-[var(--text-muted)]">
                                                <span>{user.followersCount} followers</span>
                                                <span>{user.followingCount} following</span>
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Action Button */}
                                    <div>
                                        {activeTab === 'following' ? (
                                            <button
                                                onClick={() => handleFollow(user._id, true)}
                                                disabled={followingInProgress.has(user._id)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-white hover:bg-red-500/20 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-all disabled:opacity-50"
                                            >
                                                {followingInProgress.has(user._id) ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <UserCheck size={16} />
                                                        <span className="text-sm">Following</span>
                                                    </>
                                                )}
                                            </button>
                                        ) : activeTab === 'followers' ? (
                                            <button
                                                onClick={() => handleFollow(user._id, user.isFollowingBack || false)}
                                                disabled={followingInProgress.has(user._id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all disabled:opacity-50 ${user.isFollowingBack
                                                    ? 'bg-white/5 text-[var(--text-main)] hover:bg-red-500/20 hover:text-red-400 border border-white/10 hover:border-red-500/30'
                                                    : 'bg-[var(--accent)] text-[#0F1117] hover:brightness-110'
                                                    }`}
                                            >
                                                {followingInProgress.has(user._id) ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : user.isFollowingBack ? (
                                                    <>
                                                        <UserCheck size={16} />
                                                        <span className="text-sm">Following</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus size={16} />
                                                        <span className="text-sm">Follow Back</span>
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleFollow(user._id, false)}
                                                disabled={followingInProgress.has(user._id)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-full text-[#0F1117] hover:brightness-110 transition-all disabled:opacity-50"
                                                style={{ background: "var(--accent)" }}
                                            >
                                                {followingInProgress.has(user._id) ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <UserPlus size={16} />
                                                        <span className="text-sm">Follow</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
