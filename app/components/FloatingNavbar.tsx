"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Settings, User } from "lucide-react";
import NotificationBell from "./NotificationBell";
import NotificationPanel from "./NotificationPanel";
import NetworkSheet from "./NetworkSheet";
import { useLiveRadar } from "@/hooks/useLiveRadar";

interface UserProfile {
  avatarUrl?: string;
  displayName?: string;
}

export default function FloatingNavbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { liveUsers } = useLiveRadar();
  const [isRadarOpen, setIsRadarOpen] = useState(false);

  // Fetch user profile for avatar
  useEffect(() => {
    if (status !== "authenticated") return;
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/settings/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
      } catch (e) {
        console.error("Navbar profile fetch error", e);
      }
    };
    fetchProfile();
  }, [status]);

  // Blur/glass effect after scrolling a bit
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Activity heartbeat
  useEffect(() => {
    if (status !== "authenticated") return;
    if (pathname === "/") return;
    const ping = async () => {
      try {
        await fetch("/api/radar/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activity: { type: "idle" } }),
        });
      } catch { }
    };
    ping();
    const interval = setInterval(ping, 20000);
    return () => clearInterval(interval);
  }, [status, pathname]);


  const isHome = pathname === "/";
  const authPaths = ["/login", "/register", "/auth/verify-2fa", "/auth/setup-2fa", "/forgot-password", "/reset-password"];
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p));
  const is2FALocked = (session?.user as any)?.requires2FA || (session?.user as any)?.requires2FASetup;

  if (isAuthPage || is2FALocked) return null;

  const getInitial = (email: string | null | undefined) =>
    email ? email.charAt(0).toUpperCase() : "?";

  const displayName = profile?.displayName || session?.user?.email?.split("@")[0] || "User";
  const avatarSrc = profile?.avatarUrl || (session?.user as any)?.image;

  return (
    <>
      {/* ─────────── MOBILE TOP BAR (hidden on md+) ─────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 md:hidden transition-all duration-300"
        style={{
          background: scrolled ? "var(--glass)" : isHome ? "transparent" : "var(--glass)",
          backdropFilter: scrolled || !isHome ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled || !isHome ? "blur(20px)" : "none",
          borderBottom: scrolled || !isHome ? "1px solid var(--border-soft)" : "none",
          boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.35)" : "none",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div className="relative z-50 h-[60px] flex items-center justify-between px-4 gap-3">

          {/* ── LEFT: Logo + Brand ─────────────────────── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 min-w-0 flex-shrink-0 active:opacity-70 transition-opacity"
          >
            <div className="relative w-8 h-8 flex-shrink-0">
              <Image src="/logo.png" alt="Nexora" fill className="object-contain" priority />
            </div>
            <div className="flex flex-col leading-none">
              <span
                className="text-[17px] font-bold italic tracking-tight text-white leading-none"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                NEXORA
              </span>
              <span className="text-[8.5px] text-[var(--accent)] font-mono tracking-[0.18em] uppercase mt-[2px] opacity-80">
                the next era
              </span>
            </div>
          </Link>

          {/* ── RIGHT: Bell + Avatar ───────────────────── */}
          <div className="flex items-center gap-1.5 flex-shrink-0">

            {status === "authenticated" && (
              <>
                {/* Notification Bell */}
                <div className="w-9 h-9 flex items-center justify-center">
                  <NotificationBell />
                </div>

                {/* User Avatar + Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 transition-all active:scale-90 ring-2 ring-transparent hover:ring-[var(--accent)]/40"
                    aria-label="User menu"
                  >
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-sm font-bold text-[#0b0e13]"
                        style={{ background: "linear-gradient(135deg, #4F8CFF, #4ef2b2)" }}
                      >
                        {getInitial(session?.user?.email)}
                      </div>
                    )}
                  </button>

                  {/* Dropdown menu */}
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div
                        className="absolute right-0 top-11 w-56 rounded-2xl z-50 overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
                        style={{
                          background: "rgba(18, 22, 30, 0.96)",
                          backdropFilter: "blur(20px)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {/* User info header */}
                        <div className="px-4 py-3 border-b border-white/6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-[var(--accent)]/30">
                              {avatarSrc ? (
                                <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div
                                  className="w-full h-full flex items-center justify-center text-xs font-bold text-[#0b0e13]"
                                  style={{ background: "linear-gradient(135deg, #4F8CFF, #4ef2b2)" }}
                                >
                                  {getInitial(session?.user?.email)}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-semibold text-white truncate" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                                {displayName}
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)] truncate" style={{ fontFamily: "var(--font-inter)" }}>
                                {session?.user?.email}
                              </span>
                            </div>
                          </div>
                          {/* Online dot */}
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                            <span className="text-[9px] text-[var(--accent)] font-mono uppercase tracking-widest">Active</span>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="py-1">
                          <Link
                            href={`/profile/${(session?.user as any)?.id}`}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-main)] hover:bg-white/5 transition-colors"
                            style={{ fontFamily: "var(--font-inter)" }}
                          >
                            <User className="w-4 h-4 text-[var(--text-muted)]" />
                            View Profile
                          </Link>
                          <Link
                            href="/settings/profile"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-main)] hover:bg-white/5 transition-colors"
                            style={{ fontFamily: "var(--font-inter)" }}
                          >
                            <Settings className="w-4 h-4 text-[var(--text-muted)]" />
                            Settings
                          </Link>
                        </div>

                        <div className="border-t border-white/6 py-1">
                          <button
                            onClick={() => { setShowUserMenu(false); signOut({ callbackUrl: "/register" }); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/8 transition-colors"
                            style={{ fontFamily: "var(--font-inter)" }}
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {status === "unauthenticated" && (
              <Link
                href="/login"
                className="px-4 py-2 rounded-full text-sm font-semibold text-[#0b0e13] transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #4F8CFF, #4ef2b2)", fontFamily: "var(--font-space-grotesk)" }}
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Desktop-only panels */}
      <NotificationPanel />
      <NetworkSheet isOpen={isRadarOpen} onClose={() => setIsRadarOpen(false)} liveUsers={liveUsers} />
    </>
  );
}
