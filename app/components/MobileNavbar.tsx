"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Compass, Plus, User as UserIcon, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import SettingsSheet from "./SettingsSheet";
import NetworkSheet from "./NetworkSheet";
import { useLiveRadar } from "@/hooks/useLiveRadar";

export default function MobileNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNetworkOpen, setIsNetworkOpen] = useState(false);
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const { liveUsers } = useLiveRadar();

    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isLongPressTriggeredRef = useRef(false);

    useEffect(() => {
        if (status !== "authenticated") return;
        const fetchProfile = async () => {
            try {
                const profileRes = await fetch('/api/settings/profile');
                if (profileRes.ok) {
                    const data = await profileRes.json();
                    if (data.profile?.avatarUrl) {
                        setUserAvatar(data.profile.avatarUrl);
                    }
                }
            } catch (error) {
                console.error("Navbar profile fetch error", error);
            }
        };
        fetchProfile();
    }, [status]);

    const authPaths = ["/login", "/register", "/upload", "/auth/verify-2fa", "/auth/setup-2fa", "/forgot-password", "/reset-password"];
    const isAuthPage = authPaths.some(p => pathname.startsWith(p));
    const is2FALocked = (session?.user as any)?.requires2FA || (session?.user as any)?.requires2FASetup;

    if (isAuthPage || is2FALocked || (status as string) === "loading") return null;

    const handleTouchStart = (action: () => void, isLongPressAction = false) => {
        isLongPressTriggeredRef.current = false;
        if (isLongPressAction) {
            longPressTimerRef.current = setTimeout(() => {
                isLongPressTriggeredRef.current = true;
                action();
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }, 500);
        }
    };

    const handleTouchEnd = (clickAction: () => void) => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
        if (!isLongPressTriggeredRef.current) {
            clickAction();
        }
    };

    const navItems = [
        {
            id: "home",
            icon: Home,
            label: "Home",
            isActive: pathname === "/",
            onClick: () => router.push("/")
        },
        {
            id: "discover",
            icon: Compass,
            label: "Discover",
            isActive: pathname === "/discover",
            onClick: () => router.push("/discover")
        },
        {
            id: "create",
            icon: Plus,
            label: "Create",
            isActive: false,
            onClick: () => router.push("/upload")
        },
        {
            id: "network",
            icon: Users,
            label: "Network",
            isActive: isNetworkOpen,
            onClick: () => setIsNetworkOpen(true),
            badgeCount: liveUsers.length
        },
        {
            id: "profile",
            icon: null,
            label: "Profile",
            isActive: pathname.startsWith(`/profile/${(session?.user as any)?.id}`),
            onClick: () => router.push(session?.user ? `/profile/${(session?.user as any).id}` : "/login"),
            onLongPress: () => setIsSettingsOpen(true)
        },
    ];

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none">
                {/* Edge-to-edge fade */}
                <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/80 to-transparent pointer-events-none" />

                {/* Nav pill */}
                <div
                    className="relative mx-3 pointer-events-auto"
                    style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 8px) + 8px)" }}
                >
                    <div className="bg-[var(--glass)] backdrop-blur-2xl rounded-[28px] border border-[var(--border-soft)] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] px-2 py-2.5">
                        <div className="flex items-end justify-around">
                            {navItems.map((item, index) => {
                                const isCenter = index === 2;
                                const Icon = item.icon;

                                return (
                                    <div
                                        key={item.id}
                                        className={`relative flex flex-col items-center justify-end cursor-pointer select-none ${isCenter ? 'w-14 mb-1' : 'w-14 h-12'
                                            }`}
                                        onTouchStart={() => handleTouchStart(item.onLongPress || (() => { }), !!item.onLongPress)}
                                        onTouchEnd={() => handleTouchEnd(item.onClick)}
                                        onMouseDown={() => handleTouchStart(item.onLongPress || (() => { }), !!item.onLongPress)}
                                        onMouseUp={() => handleTouchEnd(item.onClick)}
                                        onMouseLeave={() => {
                                            if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                                        }}
                                    >
                                        {isCenter ? (
                                            /* Centre Create button — floats above the pill row */
                                            <div className="relative -mb-3">
                                                <div
                                                    className="w-14 h-14 rounded-full flex items-center justify-center transform transition-transform active:scale-90 shadow-[0_4px_20px_rgba(78,242,178,0.4)]"
                                                    style={{ background: "linear-gradient(135deg, #4F8CFF, #4ef2b2)" }}
                                                >
                                                    <Plus className="w-7 h-7 text-[#0b0e13]" strokeWidth={2.8} />
                                                </div>
                                            </div>
                                        ) : (
                                            /* Regular nav items */
                                            <div className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${item.isActive ? "scale-105" : "scale-100 opacity-70"}`}>
                                                {/* Active indicator dot */}
                                                {item.isActive && (
                                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />
                                                )}

                                                {item.id === "profile" ? (
                                                    <div
                                                        className="w-7 h-7 rounded-full overflow-hidden transition-all duration-300"
                                                        style={{
                                                            padding: item.isActive ? "1.5px" : "0",
                                                            background: item.isActive ? "var(--accent)" : "transparent"
                                                        }}
                                                    >
                                                        <div className="w-full h-full rounded-full bg-[var(--bg-card)] overflow-hidden">
                                                            {(userAvatar || (session?.user as any)?.image) ? (
                                                                <Image
                                                                    src={userAvatar || (session?.user as any)?.image}
                                                                    alt="Profile"
                                                                    width={28}
                                                                    height={28}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-white/10">
                                                                    <UserIcon className="w-4 h-4 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        {Icon && <Icon
                                                            className={`w-6 h-6 transition-all duration-300 ${item.isActive
                                                                ? "text-[var(--accent)]"
                                                                : "text-[var(--text-disabled)]"
                                                                }`}
                                                            style={{
                                                                filter: item.isActive ? "drop-shadow(0 0 6px var(--accent))" : "none"
                                                            }}
                                                            strokeWidth={item.isActive ? 2.5 : 1.8}
                                                        />}

                                                        {/* Network live badge — use explicit boolean to avoid rendering "0" */}
                                                        {item.id === 'network' && (item.badgeCount ?? 0) > 0 && (
                                                            <span
                                                                className="absolute -top-1 -right-1 w-2 h-2 rounded-full ring-2 ring-[var(--bg-card)]"
                                                                style={{ backgroundColor: "var(--accent)" }}
                                                            >
                                                                <span className="w-full h-full rounded-full animate-ping opacity-75 block" style={{ backgroundColor: "var(--accent)" }} />
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Label — only render when active to avoid layout leakage */}
                                                {item.isActive && (
                                                    <span className="text-[9px] font-semibold tracking-wide font-[family-name:var(--font-inter)] leading-none text-[var(--accent)] whitespace-nowrap">
                                                        {item.label}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </nav>

            <SettingsSheet
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            <NetworkSheet
                isOpen={isNetworkOpen}
                onClose={() => setIsNetworkOpen(false)}
                liveUsers={liveUsers}
                variant="sheet"
            />
        </>
    );
}
