"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Plus, Search, LogOut, Circle, Zap } from "lucide-react";
import NotificationBell from "./NotificationBell";
import NotificationPanel from "./NotificationPanel";
import NetworkSheet from "./NetworkSheet";

import { useLiveRadar } from "@/hooks/useLiveRadar";

export default function FloatingNavbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Live Radar State
  const { liveUsers } = useLiveRadar();
  const [isRadarOpen, setIsRadarOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // ... existing scroll logic ...
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
            setIsCollapsed(true);
          } else if (currentScrollY < lastScrollY.current) {
            setIsCollapsed(false);
          }
          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Global Heartbeat
  useEffect(() => {
    if (status !== 'authenticated') return;
    if (pathname === '/') return;

    const sendHeartbeat = async () => {
      try {
        await fetch('/api/radar/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activity: { type: 'idle' } })
        });
      } catch (e) {
        console.error("Heartbeat error", e);
      }
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 20000);
    return () => clearInterval(interval);
  }, [status, pathname]);

  const handleUploadClick = () => {
    router.push("/upload");
  };

  const getInitial = (email: string | null | undefined) => {
    if (!email) return "?";
    return email.charAt(0).toUpperCase();
  };

  const isHome = pathname === "/";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out animate-navbar-fade 
        ${isCollapsed ? "h-[52px]" : "h-[64px]"}
        ${isHome ? "md:hidden" : ""} 
        `} // Hide on Desktop Home, Show on Mobile Home
        style={{
          background: isHome ? "transparent" : "var(--glass)",
          backdropFilter: isHome ? "none" : "blur(12px)",
          WebkitBackdropFilter: isHome ? "none" : "blur(12px)",
          borderBottom: isHome ? "none" : "1px solid var(--border-soft)",
          boxShadow: isHome ? "none" : "var(--shadow-soft)",
        }}
      >
        <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Left: Logo Sigil (Hidden on Home) */}
          {!isHome && (
            <Link href="/" className="hidden md:flex items-center gap-2">
              <div className={`transition-all duration-300 ${isCollapsed ? "w-8 h-8" : "w-10 h-10"}`}>
                <img src="/logo.png" alt="Nexora Logo" className="w-full h-full object-contain" />
              </div>
            </Link>
          )}


          {/* Mobile Home Title (Logo Only) */}
          <div className="md:hidden">
            <div className="w-8 h-8">
              <img src="/logo.png" alt="Nexora Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Center: Search Bar (Hidden on Mobile) */}
          <div
            className={`hidden md:block transition-all duration-300 ease-out ${isSearchFocused ? "w-[480px]" : "w-[320px]"} ${isCollapsed ? "scale-95" : "scale-100"}`}
          >
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-200 ${isSearchFocused ? "text-[#4F8CFF]" : "text-[#9AA0AA]"} ${isCollapsed ? "w-4 h-4" : "w-5 h-5"}`} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`w-full ${isCollapsed ? "h-9 pl-11 pr-4 text-sm" : "h-11 pl-12 pr-4"} rounded-full bg-[#0F1117] border border-[#5C6270]/30 text-[#E5E7EB] placeholder-[#5C6270] focus:outline-none focus:border-[#4F8CFF]/50 focus:ring-2 focus:ring-[#4F8CFF]/20 transition-all duration-200`}
                style={{ fontFamily: "var(--font-inter)" }}
              />
            </div>
          </div>

          {/* Right: Action Icons */}
          <div className="flex items-center gap-4">
            {status === "authenticated" && (
              <>
                {/* Notifications */}
                <NotificationBell className={`${isCollapsed ? "scale-90" : "scale-100"} hidden md:block`} />

                {/* Live Radar (Mobile & Desktop) -> Now Desktop Only */}
                <button
                  onClick={() => setIsRadarOpen(true)}
                  className={`hidden md:block relative p-2 rounded-full hover:bg-white/5 transition-all duration-300 group ${isCollapsed ? "scale-90" : "scale-100"}`}
                  aria-label="Live Radar"
                >
                  {liveUsers.length > 0 ? (
                    // Active State: Breathing Mint Dot
                    <div className="relative flex items-center justify-center">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-[#2DE2A6] opacity-30 animate-ping duration-[3000ms]" />
                      <Circle className="w-5 h-5 text-[#2DE2A6] fill-[#2DE2A6]" strokeWidth={2.5} />
                      {/* Ripple Effect (Simulated) */}
                      <span className="absolute -inset-1 rounded-full border border-[#2DE2A6]/40 animate-pulse" />
                    </div>
                  ) : (
                    // Idle State: Small Muted Circle
                    <Circle className="w-5 h-5 text-[#5C6270]" strokeWidth={2} />
                  )}
                </button>



                {/* Upload (Mobile & Desktop) */}
                <button
                  onClick={handleUploadClick}
                  className={`relative p-2 rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#2DE2A6] hover:shadow-lg hover:shadow-[#4F8CFF]/30 transition-all duration-200 ${isCollapsed ? "scale-90" : "scale-100"}`}
                  aria-label="Upload"
                >
                  <Plus className={`text-white transition-all ${isCollapsed ? "w-5 h-5" : "w-6 h-6"}`} strokeWidth={2.5} />
                </button>

                {/* Avatar (Hidden on Mobile) */}
                <div className="hidden md:block relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#2DE2A6] text-white font-semibold hover:shadow-lg hover:shadow-[#4F8CFF]/20 transition-all duration-200 overflow-hidden ${isCollapsed ? "w-9 h-9 text-sm scale-90" : "w-10 h-10 text-base"}`}
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {session?.user?.image ? (
                      <img
                        src={session.user.image}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitial(session?.user?.email)
                    )}
                  </button>
                  {/* ... User Menu ... (Keep existing code) */}
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 mt-2 w-56 rounded-xl z-50 overflow-hidden" style={{ background: "rgba(23, 27, 34, 0.95)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.1)", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)" }}>
                        <div className="px-4 py-3 border-b border-white/5">
                          <p className="text-sm text-[#E5E7EB] truncate" style={{ fontFamily: "var(--font-inter)" }}>{session?.user?.email}</p>
                        </div>

                        <Link href="/settings/profile" className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#E5E7EB] hover:bg-white/5 transition-colors" style={{ fontFamily: "var(--font-inter)" }} onClick={() => setShowUserMenu(false)}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                          Profile
                        </Link>
                        <button onClick={() => signOut({ callbackUrl: "/register" })} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#FF6B6B] hover:bg-white/5 transition-colors" style={{ fontFamily: "var(--font-inter)" }}>
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {status === "unauthenticated" && (
              <Link
                href="/login"
                className={`px-6 py-2 rounded-full bg-gradient-to-r from-[#4F8CFF] to-[#2DE2A6] text-white font-medium hover:shadow-lg hover:shadow-[#4F8CFF]/30 transition-all duration-200 ${isCollapsed ? "scale-90 text-sm" : "text-base"}`}
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      </nav >

      {/* Spacer */}
      < div className={`${isCollapsed ? "h-[52px]" : "h-[64px]"} ${isHome ? "md:hidden" : ""}`
      } />

      {/* Notification Panel */}
      <NotificationPanel />

      {/* Live Radar Panel */}
      <NetworkSheet isOpen={isRadarOpen} onClose={() => setIsRadarOpen(false)} liveUsers={liveUsers} />
    </>
  );
}
