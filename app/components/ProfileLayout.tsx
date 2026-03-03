"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Settings, Lock, Bell, Palette } from "lucide-react";

const NAV_ITEMS = [
    { label: "Profile", href: "/settings/profile", icon: User },
    { label: "Account", href: "/settings/account", icon: Settings },
    { label: "Privacy", href: "/settings/privacy", icon: Lock },
    { label: "Notifications", href: "/settings/notifications", icon: Bell },
    { label: "Appearance", href: "/settings/appearance", icon: Palette },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] pt-safe-top pb-safe-nav md:pt-20 md:pb-12 px-0 md:px-8">
            <div className="max-w-7xl mx-auto">

                {/* ── Mobile: Logo header ─────────────────────── */}
                <div className="flex items-center gap-2.5 mb-4 md:hidden px-4 pt-2">
                    <img src="/logo.png" alt="Nexora" className="w-6 h-6 object-contain" />
                    <div>
                        <div className="text-[14px] font-bold italic tracking-tight text-white font-[family-name:var(--font-space-grotesk)] leading-none">
                            NEXORA
                        </div>
                        <div className="text-[7.5px] text-[var(--accent)] font-mono uppercase tracking-[0.2em] mt-0.5 opacity-80">
                            Settings
                        </div>
                    </div>
                </div>

                {/* ── Mobile: Tab bar ──────────────────────────── */}
                <nav className="flex md:hidden gap-1 bg-[var(--bg-card)] border-b border-[var(--border-soft)] px-2 pb-2 overflow-x-auto scrollbar-hide">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`
                                    flex flex-col items-center gap-1 px-4 pt-2.5 pb-2 rounded-xl
                                    text-[10px] font-bold whitespace-nowrap flex-shrink-0
                                    transition-all duration-300 font-[family-name:var(--font-inter)]
                                    min-w-[70px] relative
                                    ${isActive
                                        ? "text-[var(--accent)] bg-[var(--accent)]/8"
                                        : "text-[var(--text-muted)] hover:text-white"
                                    }
                                `}
                            >
                                <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? "scale-110 text-[var(--accent)]" : "text-[var(--text-muted)]"}`} />
                                <span className="tracking-tight">{item.label}</span>
                                {isActive && (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* ── Desktop: sidebar + content grid ─────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 px-4 md:px-0 mt-4 md:mt-0">

                    {/* Sidebar (desktop only) */}
                    <div className="hidden lg:block lg:col-span-1">
                        <nav className="flex flex-col space-y-2 sticky top-24">
                            <Link href="/" className="flex items-center gap-3 mb-10 px-4 group transition-transform hover:scale-[1.02] active:scale-95">
                                <div className="relative w-10 h-10 flex-shrink-0">
                                    <img src="/logo.png" alt="Nexora" className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-0 group-hover:opacity-20 blur-md transition-opacity" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold italic tracking-tight text-white font-[family-name:var(--font-space-grotesk)] leading-none">
                                        NEXORA
                                    </span>
                                    <span className="text-[10px] text-[var(--accent)] font-mono uppercase tracking-[0.2em] mt-1 opacity-70">
                                        Settings
                                    </span>
                                </div>
                            </Link>

                            <h2 className="text-xs font-bold text-[var(--text-disabled)] uppercase tracking-[0.2em] mb-4 px-4 font-[family-name:var(--font-jetbrains-mono)]">Navigation</h2>
                            {NAV_ITEMS.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                            ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                                            : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]"
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive ? "text-[var(--accent)]" : "text-[var(--text-disabled)] group-hover:text-[var(--text-main)]"}`} />
                                        <span className="font-medium font-[family-name:var(--font-inter)]">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="col-span-1 lg:col-span-3">
                        <div className="bg-[var(--bg-card)] rounded-2xl md:rounded-3xl border border-[var(--border-soft)] p-4 md:p-8 min-h-[400px] md:min-h-[600px] shadow-[var(--shadow-soft)] relative overflow-hidden">
                            {/* Accent glow */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent)]/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
