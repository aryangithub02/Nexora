"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { User, Shield, Moon, Settings, LogOut, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface SettingsSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsSheet({ isOpen, onClose }: SettingsSheetProps) {
    const { data: session } = useSession();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Prevent body scroll when sheet is open
            document.body.style.overflow = "hidden";
        } else {
            setTimeout(() => setIsVisible(false), 300); // Wait for animation
            document.body.style.overflow = "unset";
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const menuItems = [
        {
            icon: User,
            label: "Edit Profile",
            href: "/settings/profile", // Assuming this will direct to profile editing
            description: "Name, bio, and avatar"
        },
        {
            icon: Settings,
            label: "Account",
            href: "/settings/account",
            description: "Email, security, and data"
        },
        {
            icon: Shield,
            label: "Privacy",
            href: "/settings/privacy",
            description: "Visibility and blocking"
        },
        {
            icon: Moon,
            label: "Appearance",
            href: "/settings/appearance",
            description: "Theme, motion, and color"
        }
    ];

    return (
        <div className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                className={`absolute bottom-0 left-0 right-0 bg-[#0F1117] rounded-t-[32px] border-t border-white/10 p-6 transition-transform duration-300 ease-out transform ${isOpen ? "translate-y-0" : "translate-y-full"}`}
                style={{
                    boxShadow: "0 -8px 40px rgba(0,0,0,0.6)"
                }}
            >
                {/* Drag Handle */}
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8" />

                {/* Profile Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#2DE2A6] p-[2px]">
                        <div className="w-full h-full rounded-full bg-[#0F1117] overflow-hidden flex items-center justify-center">
                            {(session?.user as any)?.image ? (
                                <Image
                                    src={(session?.user as any).image}
                                    alt="Profile"
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-xl text-white font-bold">
                                    {session?.user?.email?.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
                            {session?.user?.name || "User"}
                        </h2>
                        <p className="text-sm text-[#5C6270] font-[family-name:var(--font-jetbrains-mono)]">
                            @{session?.user?.email?.split('@')[0]}
                        </p>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-2 mb-8">
                    {menuItems.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            onClick={onClose}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] active:scale-98 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#171B22] flex items-center justify-center text-[#4F8CFF] group-hover:text-white transition-colors">
                                <item.icon size={20} strokeWidth={2} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-medium font-[family-name:var(--font-inter)]">
                                    {item.label}
                                </h3>
                                <p className="text-xs text-[#5C6270]">
                                    {item.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Sign Out */}
                <button
                    onClick={() => signOut()}
                    className="w-full p-4 rounded-2xl bg-[#171B22] text-[#FF6B6B] font-medium flex items-center justify-center gap-2 hover:bg-[#FF6B6B]/10 transition-colors"
                >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>

                <div className="h-6" />
            </div>
        </div>
    );
}
