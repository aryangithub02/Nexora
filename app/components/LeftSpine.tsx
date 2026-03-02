"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Compass, Users, Bookmark, Settings, Search, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import NotificationBell from "./NotificationBell";
import { useRouter } from "next/navigation";

interface LeftSpineProps {
    onAvatarClick?: () => void;
}

interface UserProfile {
    avatarUrl?: string;
    displayName?: string;
}

export default function LeftSpine({ onAvatarClick }: LeftSpineProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            if (!session?.user) return;
            try {
                const res = await fetch('/api/settings/profile');
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.profile);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };
        fetchProfile();
    }, [session]);

    const isHome = pathname === "/";
    const authPaths = ["/login", "/register", "/auth/verify-2fa", "/auth/setup-2fa", "/forgot-password", "/reset-password"];
    const isAuthPage = authPaths.some(p => pathname.startsWith(p));
    const is2FALocked = (session?.user as any)?.requires2FA || (session?.user as any)?.requires2FASetup;

    if (isAuthPage || is2FALocked) return null;

    const NAV_ITEMS = [
        { label: "Home", href: "/", icon: Home },
        { label: "Discover", href: "/discover", icon: Compass },
        { label: "Network", href: "/network", icon: Users },
        { label: "Saved", href: "/saved", icon: Bookmark },
        { label: "Settings", href: "/settings/profile", icon: Settings },
    ];

    const getInitial = (email: string | null | undefined) => {
        if (!email) return "?";
        return email.charAt(0).toUpperCase();
    };

    return (
        <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[260px] bg-[var(--glass)] backdrop-blur-xl border-r border-[var(--border-soft)] flex-col z-50">
            {/* Top Fixed Branding */}
            <div className="p-8 pb-4">
                <div className="flex items-center gap-3">
                    <Link href="/" className="relative w-10 h-10 block transition-transform hover:scale-110 active:scale-95">
                        <Image src="/logo.png" alt="Nexora" fill className="object-contain" priority />
                    </Link>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold tracking-tight text-white font-[family-name:var(--font-space-grotesk)] leading-none italic">
                            NEXORA
                        </span>
                        <span className="text-[10px] text-[var(--accent)] font-mono tracking-widest uppercase mt-1">
                            the next era
                        </span>
                    </div>
                </div>
            </div>

            {/* Scrollable Navigation Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 sidebar-scrollbar transition-colors">
                {/* User Profile Card */}
                {session?.user && (
                    <div
                        onClick={() => router.push(`/profile/${(session.user as any).id}`)}
                        className="mb-8 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer flex items-center gap-4 group"
                    >
                        <div className="relative w-10 h-10 flex-shrink-0">
                            <div className="absolute -inset-1 rounded-full bg-[var(--accent)] opacity-20 blur-sm group-hover:opacity-40 transition-opacity" />
                            <div className="relative w-full h-full rounded-full p-[1.5px]" style={{ background: "var(--accent)" }}>
                                <div className="w-full h-full rounded-full bg-[var(--bg-main)] flex items-center justify-center overflow-hidden">
                                    {profile?.avatarUrl ? (
                                        <Image src={profile.avatarUrl} alt="P" width={40} height={40} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white text-xs font-bold">{getInitial(session?.user?.email)}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col min-w-0 pr-1">
                            <span className="text-sm font-bold text-white truncate font-[family-name:var(--font-space-grotesk)]">
                                {profile?.displayName || session?.user?.email?.split('@')[0]}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                                <span className="text-[10px] text-[var(--accent)] font-mono uppercase tracking-tighter">Active</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Desktop Search Bar */}
                <div className="mb-8 px-1">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[var(--accent)] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent)]/30 focus:ring-1 focus:ring-[var(--accent)]/20 transition-all"
                        />
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex flex-col gap-2">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${isActive
                                    ? 'bg-gradient-to-r from-[var(--accent)]/20 to-transparent text-[var(--accent)]'
                                    : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent)] shadow-[0_0_15px_var(--accent)]" />
                                )}

                                <Icon
                                    className={`w-5 h-5 transition-transform duration-300 ${isActive
                                        ? "stroke-[2.5px]"
                                        : "group-hover:scale-110"
                                        }`}
                                />

                                <span className="text-sm font-semibold tracking-wide font-[family-name:var(--font-inter)]">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
                        <div className="flex items-center gap-4 px-4 py-3 rounded-xl text-[var(--text-muted)] hover:bg-white/5 hover:text-white transition-all cursor-pointer group">
                            <NotificationBell />
                            <span className="text-sm font-semibold tracking-wide font-[family-name:var(--font-inter)]">Notifications</span>
                        </div>

                        <Link
                            href="/upload"
                            className="flex items-center gap-4 px-4 py-4 mt-6 rounded-2xl bg-gradient-to-r from-[#4F8CFF] to-[#2DE2A6] text-white transition-all duration-300 shadow-lg shadow-[#4F8CFF]/20 hover:shadow-[#4F8CFF]/40 active:scale-[0.98]"
                        >
                            <Plus className="w-6 h-6 stroke-[3px]" />
                            <span className="text-base font-bold tracking-wider font-[family-name:var(--font-space-grotesk)]">CREATE</span>
                        </Link>
                    </div>
                </nav>
            </div>

            {/* Fixed Bottom Indicator */}
            <div className="px-10 py-6 border-t border-white/5 flex items-center justify-between bg-[var(--glass)]/50 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                    <span className="text-[9px] text-[var(--text-muted)] font-mono uppercase tracking-widest">Connected</span>
                </div>
                <div className="text-[10px] text-white/20 font-mono italic">
                    v1.0.4
                </div>
            </div>
        </aside>
    );
}
