"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { IVideo } from "@/models/Video";
import ReelCard, { ReelCardRef } from "./ReelCard";
import { useSearchParams } from "next/navigation";

interface FeedProps {
  videos: IVideo[];
  onVideoDeleted?: (id: string) => void;
}

export default function Feed({ videos, onVideoDeleted }: FeedProps) {
  const reelRefs = useRef<Map<string, React.MutableRefObject<ReelCardRef | null>>>(new Map());
  const [activeReelId, setActiveReelId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0); // Track numeric index for windowing
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('reelId');
  const fromSaved = searchParams.get('fromSaved') === 'true';
  const [memoryGlowId, setMemoryGlowId] = useState<string | null>(null);  // Create refs for each video
  const getOrCreateRef = useCallback((videoId: string) => {
    if (!reelRefs.current.has(videoId)) {
      reelRefs.current.set(videoId, { current: null });
    }
    return reelRefs.current.get(videoId)!;
  }, []);

  // Handle visibility changes from ReelCards
  // Centralized Intersection Observer for Virtualization
  useEffect(() => {
    const options = {
      root: containerRef.current, // Use the scroll container as root
      threshold: 0.6, // Trigger when 60% visible
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const videoId = entry.target.getAttribute("data-reel-id");
          const indexStr = entry.target.getAttribute("data-index");

          if (videoId && indexStr) {
            const newIndex = parseInt(indexStr, 10);
            setActiveReelId(videoId);
            setActiveIndex(newIndex);

            // Auto-play logic moved here (managed by prop passed to ReelCard)
            // We don't need to manually call ref.current.play() because ReelCard watches 'isActive' prop
          }
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersect, options);

    // Observe all wrappers
    const wrappers = document.querySelectorAll(".reel-wrapper");
    wrappers.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [videos]); // Re-attach when list changes

  // Pause off-screen reels logic (now handled by Virtualization unmounting + isActive prop)
  // When a ReelCard unmounts, it cleans itself up.
  // When it mounts, it checks isActive.


  // Auto-scroll to highlighted reel + memory glow from Saved
  useEffect(() => {
    if (highlightId && videos.length > 0) {
      // Delay slightly to allow layout to stabilize
      setTimeout(() => {
        const el = document.getElementById(`reel-${highlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Force active state handoff immediately
          setActiveReelId(highlightId);

          // If coming from Saved, trigger the memory glow effect
          if (fromSaved) {
            setMemoryGlowId(highlightId);
            // Remove glow after animation completes (2 seconds)
            setTimeout(() => setMemoryGlowId(null), 2000);
          }
        }
      }, 500);
    }
  }, [highlightId, videos, fromSaved]); // Run when videos load or ID changes


  // Prefetch Strategy: Cache N+1 URL
  useEffect(() => {
    if (!activeReelId || videos.length === 0) return;

    const index = videos.findIndex(v => v._id.toString() === activeReelId);
    if (index !== -1 && index < videos.length - 1) {
      const nextVideo = videos[index + 1];
      // Warm up the cache with the next video's URL
      import("@/lib/video-cache").then(({ VideoCache }) => {
        VideoCache.save(nextVideo._id.toString(), nextVideo.videoUrl);
      });
    }
  }, [activeReelId, videos]);


  // Snap scrolling behavior
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isScrolling = false;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        snapToNearestReel(container);
      }, 150);
    };

    const snapToNearestReel = (container: HTMLElement) => {
      // If we are actively scrolling to a highlight, maybe disable snap? 
      // But for now, let's keep it simple.

      const reels = container.querySelectorAll("[data-reel-id]");
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 2;

      let nearestReel: Element | null = null;
      let minDistance = Infinity;

      for (const reel of Array.from(reels)) {
        const reelRect = reel.getBoundingClientRect();
        const reelCenter = reelRect.top + reelRect.height / 2;
        const distance = Math.abs(containerCenter - reelCenter);

        if (distance < minDistance) {
          minDistance = distance;
          nearestReel = reel;
        }
      }

      if (nearestReel) {
        nearestReel.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // Calculate Safe Viewport Height
  useEffect(() => {
    const calculateSafeHeight = () => {
      const TOP_BAR_HEIGHT = 56;
      const BOTTOM_BAR_HEIGHT = 72;
      const safeHeight = window.innerHeight - TOP_BAR_HEIGHT - BOTTOM_BAR_HEIGHT;
      document.documentElement.style.setProperty("--safe-height", `${safeHeight}px`);
    };

    calculateSafeHeight();
    window.addEventListener('resize', calculateSafeHeight);
    return () => window.removeEventListener('resize', calculateSafeHeight);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[var(--safe-height,100dvh)] md:h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide relative feed-envelope"
    >
      {/* Journey Progress Bar (Mock) */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[340px] h-1 z-50">
        <div className="h-full bg-gradient-to-r from-[#4F8CFF] to-[#2DE2A6] w-[15%]" />
      </div>

      {/* Seamless vertical stack - no gaps, pure cinema */}
      <div className="flex flex-col items-center w-full">
        <div className="text-center mb-6 opacity-50 hidden md:block">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-[family-name:var(--font-jetbrains-mono)]">The Lens</p>
        </div>

        {videos.map((video, index) => {
          const videoId = video._id?.toString() || "";
          const ref = getOrCreateRef(videoId);
          const isHighlighted = highlightId === videoId;
          const isMemoryGlow = memoryGlowId === videoId;

          return (
            <div
              key={videoId}
              id={`reel-${videoId}`}
              data-reel-id={videoId}
              data-index={index}
              className={`reel-wrapper w-full h-[var(--safe-height,100dvh)] md:h-auto flex items-center justify-center snap-start md:snap-center md:mb-6 transition-all duration-1000 ${isHighlighted ? 'scale-[1.02]' : ''
                }`}
            >
              <div className={`w-full h-full md:w-[340px] md:max-h-[70vh] md:aspect-[9/16] relative transition-all duration-500 group ${isHighlighted ? 'md:ring-1 md:ring-[var(--accent)]/50 md:shadow-[0_0_30px_color-mix(in_srgb,var(--accent),transparent_85%)] md:rounded-3xl' : ''
                }`}>
                {/* Glass Border Effect (Desktop Only) */}
                <div className="hidden md:block absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                {/* Drop Shadow "Projector Light" (Desktop Only) */}
                <div className="hidden md:block absolute -bottom-12 left-4 right-4 h-12 bg-[var(--accent)]/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                {/* Memory Glow - special animation when opening from Saved */}
                {isMemoryGlow && (
                  <div
                    className="absolute -inset-3 rounded-[36px] -z-10"
                    style={{
                      background: 'linear-gradient(135deg, rgba(45, 226, 166, 0.3), rgba(79, 140, 255, 0.2))',
                      filter: 'blur(20px)',
                      animation: 'memoryPulse 2s ease-out forwards'
                    }}
                  />
                )}

                {/* Selection Glow for Notifications (non-saved highlight) */}
                {isHighlighted && !isMemoryGlow && (
                  <div className="absolute -inset-4 rounded-[40px] bg-[var(--accent)]/15 blur-xl -z-10" />
                )}

                <div className="w-full h-full md:rounded-2xl md:overflow-hidden md:shadow-[0_25px_50px_-12px_color-mix(in_srgb,var(--accent),transparent_70%)] relative">
                  {/* Virtualization: Only render if close to active index */}
                  {Math.abs(index - activeIndex) <= 1 ? (
                    <ReelCard
                      ref={ref}
                      video={video}
                      isActive={activeReelId === videoId}
                      priority={index === 0}
                      onVisibilityChange={() => { }} // Deprecated, handled by parent
                      onVideoDeleted={onVideoDeleted}
                    />
                  ) : (
                    /* Lightweight Placeholder for off-screen reels */
                    <div className="w-full h-full bg-[#0F1117] flex items-center justify-center">
                      <div className="w-full h-full relative overflow-hidden">
                        {/* Ensure aspect ratio is maintained */}
                        {video.thumbnailUrl && (
                          <img
                            src={video.thumbnailUrl}
                            alt="Preview"
                            className="w-full h-full object-cover opacity-30 blur-xl scale-110"
                            loading="lazy"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {/* Optional: Spinner or Icon */}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div className="h-32 flex items-center justify-center text-[var(--text-disabled)] text-xs font-[family-name:var(--font-jetbrains-mono)] snap-start">
          End of transmission
        </div>
      </div>
    </div>
  );
}
