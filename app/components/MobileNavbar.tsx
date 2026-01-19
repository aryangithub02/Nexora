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

    // Sheets state
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNetworkOpen, setIsNetworkOpen] = useState(false);

    // Data state
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const { liveUsers } = useLiveRadar();

    // Long press logic
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isLongPressTriggeredRef = useRef(false);

    // Fetch User Profile (for avatar)
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

    // Check if we should hide the navbar content
    const hiddenPaths = ["/login", "/register", "/upload"];
    const shouldHide = hiddenPaths.some(p => pathname.startsWith(p));

    if (shouldHide || (status as string) === "loading") return null;

    // Handle touch interactions
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
                {/* Gradient Fade */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/90 to-transparent pointer-events-none" />

                <div className="relative mx-4 mb-4 pointer-events-auto">
                    {/* Glass Bar */}
                    <div className="bg-[var(--glass)] backdrop-blur-xl rounded-[24px] border border-[var(--border-soft)] shadow-[var(--shadow-soft)] px-2 py-3">
                        <div className="flex items-center justify-between px-2">
                            {navItems.map((item, index) => {
                                const isCenter = index === 2; // Create button index
                                const Icon = item.icon;

                                return (
                                    <div
                                        key={item.id}
                                        className={`relative flex flex-col items-center justify-center ${isCenter ? 'w-14 -mt-8' : 'w-12 pt-1'}`}
                                        onTouchStart={() => handleTouchStart(item.onLongPress || (() => { }), !!item.onLongPress)}
                                        onTouchEnd={() => handleTouchEnd(item.onClick)}
                                        onMouseDown={() => handleTouchStart(item.onLongPress || (() => { }), !!item.onLongPress)}
                                        onMouseUp={() => handleTouchEnd(item.onClick)}
                                        onMouseLeave={() => {
                                            if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                                        }}
                                    >
                                        {isCenter ? (
                                            // The "Pushing Out" Center Button
                                            <div className="relative group">
                                                {/* Button */}
                                                <div className="w-14 h-14 rounded-full p-[1.5px] transform transition-transform active:scale-95" style={{ background: "var(--accent)", boxShadow: "0 8px 24px var(--accent-glow)" }}>
                                                    <div className="w-full h-full rounded-full bg-[var(--bg-card)] flex items-center justify-center relative overflow-hidden group-hover:bg-white/10 transition-colors">
                                                        <Plus className="w-7 h-7 text-[var(--text-main)]" strokeWidth={2.5} />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // Standard Icons
                                            <div className={`relative transition-all duration-300 ${item.isActive ? "scale-110 -translate-y-1" : "scale-100 opacity-80"
                                                }`}>
                                                {item.id === "profile" ? (
                                                    <div className={`w-7 h-7 rounded-full p-[1.5px] ${item.isActive ? "" : "bg-transparent"
                                                        }`} style={{ background: item.isActive ? "var(--accent)" : "transparent" }}>
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
                                                    Icon && <Icon
                                                        className={`w-6 h-6 transition-all duration-300 ${item.isActive
                                                            ? "text-[var(--accent)]"
                                                            : "text-[var(--text-disabled)]"
                                                            }`}
                                                        style={{
                                                            filter: item.isActive ? "drop-shadow(0 0 8px var(--accent))" : "none"
                                                        }}
                                                        strokeWidth={item.isActive ? 2.5 : 2}
                                                    />
                                                )}

                                                {/* Badge (Mint for Radar/Network) */}
                                                {item.id === 'network' && item.badgeCount && item.badgeCount > 0 && (
                                                    <span className="absolute -top-1 -right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--bg-card)] flex items-center justify-center" style={{ backgroundColor: "var(--accent)" }}>
                                                        <span className="w-full h-full rounded-full animate-ping opacity-75" style={{ backgroundColor: "var(--accent)" }} />
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Label (Hidden for center) */}
                                        {!isCenter && (
                                            <span className={`text-[9px] mt-1 transition-all duration-300 font-medium ${item.isActive ? "text-[var(--accent)] opacity-100" : "text-[var(--text-disabled)] opacity-0 h-0 w-0 overflow-hidden"
                                                }`}>
                                                {item.label}
                                            </span>
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
