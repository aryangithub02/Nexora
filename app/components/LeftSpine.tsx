"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Compass, Users, Bookmark, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import NotificationBell from "./NotificationBell";

interface LeftSpineProps {
    onAvatarClick?: () => void;
}

interface UserProfile {
    avatarUrl?: string;
    displayName?: string;
}

export default function LeftSpine({ onAvatarClick }: LeftSpineProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);

    // Fetch user profile for avatar
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
        <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[72px] bg-[var(--glass)] backdrop-blur-md border-r border-[var(--border-soft)] flex-col items-center py-6 z-50">
            {/* App Logo */}
            <div className="mb-8 w-10 h-10 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer">
                <Link href="/">
                    <img src="/logo.png" alt="Nexora" className="w-full h-full object-contain" />
                </Link>
            </div>

            {/* Top: Avatar Status Ring */}
            {session?.user && (session.user as any).id ? (
                <Link
                    href={`/profile/${(session.user as any).id}`}
                    className="mb-12 relative group cursor-pointer block"
                >
                    {/* Outer glow ring */}
                    <div className="absolute -inset-1 rounded-full bg-[var(--accent)] opacity-30 blur-md group-hover:opacity-50 transition-opacity" />
                    <div className="relative w-11 h-11 rounded-full p-[2px]" style={{ background: "var(--accent)" }}>
                        <div className="w-full h-full rounded-full bg-[var(--bg-main)] flex items-center justify-center overflow-hidden">
                            {profile?.avatarUrl ? (
                                <Image
                                    src={profile.avatarUrl}
                                    alt="Profile"
                                    width={44}
                                    height={44}
                                    className="w-full h-full object-cover rounded-full"
                                />
                            ) : (
                                <span className="text-white font-bold text-sm font-[family-name:var(--font-space-grotesk)]">
                                    {getInitial(session?.user?.email)}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Status indicator with pulse */}
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[var(--bg-main)]" style={{ backgroundColor: "var(--accent)" }}>
                        <div className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ backgroundColor: "var(--accent)" }} />
                    </div>
                </Link>
            ) : (
                <div className="mb-12 relative group cursor-pointer" onClick={onAvatarClick}>
                    <div className="absolute -inset-1 rounded-full bg-[var(--accent)] opacity-30 blur-md group-hover:opacity-50 transition-opacity" />
                    <div className="relative w-11 h-11 rounded-full p-[2px]" style={{ background: "var(--accent)" }}>
                        <div className="w-full h-full rounded-full bg-[var(--bg-main)] flex items-center justify-center overflow-hidden">
                            {profile?.avatarUrl ? (
                                <Image
                                    src={profile.avatarUrl}
                                    alt="Profile"
                                    width={44}
                                    height={44}
                                    className="w-full h-full object-cover rounded-full"
                                />
                            ) : (
                                <span className="text-white font-bold text-sm font-[family-name:var(--font-space-grotesk)]">
                                    {getInitial(session?.user?.email)}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[var(--bg-main)]" style={{ backgroundColor: "var(--accent)" }}>
                        <div className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ backgroundColor: "var(--accent)" }} />
                    </div>
                </div>
            )}

            {/* Nav Actions - The Heartbeat */}
            <nav className="flex flex-col gap-6">
                {NAV_ITEMS.slice(0, 4).map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`relative group flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 ${isActive
                                ? 'bg-[var(--accent)]/10'
                                : 'hover:bg-[var(--bg-hover)]'
                                }`}
                        >
                            {/* Glow Ring for Active State */}
                            {isActive && (
                                <>
                                    {/* Outer glow */}
                                    <div className="absolute inset-0 rounded-xl bg-[var(--accent)]/20 blur-lg animate-glow-ring" />
                                    {/* Idle pulse every 12 seconds */}
                                    <div className="absolute inset-0 rounded-xl animate-idle-pulse" />
                                </>
                            )}

                            <Icon
                                className={`relative z-10 transition-all duration-300 ${isActive
                                    ? "text-[var(--accent)] w-6 h-6 stroke-[2.5px]"
                                    : "text-[var(--text-muted)] w-5 h-5 group-hover:text-[var(--text-main)] group-hover:w-6 group-hover:h-6"
                                    }`}
                            />

                            {/* Tooltip on hover */}
                            <div className="absolute left-full ml-3 px-3 py-1.5 bg-[var(--bg-card)]/95 backdrop-blur-md rounded-lg border border-[var(--border-soft)] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                <span
                                    className="text-xs text-white font-medium"
                                    style={{ fontFamily: "var(--font-inter)" }}
                                >
                                    {item.label}
                                </span>
                            </div>
                        </Link>
                    );
                })}

                {/* Signals (Notifications) */}
                <NotificationBell />

                {/* Settings (Last Item) */}
                {(() => {
                    const item = NAV_ITEMS[4]; // Settings
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`relative group flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 ${isActive
                                ? 'bg-[var(--accent)]/10'
                                : 'hover:bg-[var(--bg-hover)]'
                                }`}
                        >
                            {isActive && (
                                <>
                                    <div className="absolute inset-0 rounded-xl bg-[var(--accent)]/20 blur-lg animate-glow-ring" />
                                    <div className="absolute inset-0 rounded-xl animate-idle-pulse" />
                                </>
                            )}

                            <Icon
                                className={`relative z-10 transition-all duration-300 ${isActive
                                    ? "text-[var(--accent)] w-6 h-6 stroke-[2.5px]"
                                    : "text-[var(--text-muted)] w-5 h-5 group-hover:text-[var(--text-main)] group-hover:w-6 group-hover:h-6"
                                    }`}
                            />
                            <div className="absolute left-full ml-3 px-3 py-1.5 bg-[var(--bg-card)]/95 backdrop-blur-md rounded-lg border border-[var(--border-soft)] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                <span className="text-xs text-white font-medium" style={{ fontFamily: "var(--font-inter)" }}>
                                    {item.label}
                                </span>
                            </div>
                        </Link>
                    );
                })()}

            </nav>

            {/* Bottom breathing indicator - System heartbeat */}
            <div className="mt-auto mb-4">
                <div className="w-2 h-2 rounded-full bg-[var(--accent)]/50 animate-slow-breath" />
            </div>
        </aside>
    );
}
