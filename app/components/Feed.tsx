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
  const [activeIndex, setActiveIndex] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('reelId');
  const fromSaved = searchParams.get('fromSaved') === 'true';
  const [memoryGlowId, setMemoryGlowId] = useState<string | null>(null);
  const getOrCreateRef = useCallback((videoId: string) => {
    if (!reelRefs.current.has(videoId)) {
      reelRefs.current.set(videoId, { current: null });
    }
    return reelRefs.current.get(videoId)!;
  }, []);

  useEffect(() => {
    const options = {
      root: containerRef.current,
      threshold: 0.6,
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

          }
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersect, options);

    const wrappers = document.querySelectorAll(".reel-wrapper");
    wrappers.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [videos]);

  useEffect(() => {
    if (highlightId && videos.length > 0) {

      setTimeout(() => {
        const el = document.getElementById(`reel-${highlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });

          setActiveReelId(highlightId);

          if (fromSaved) {
            setMemoryGlowId(highlightId);

            setTimeout(() => setMemoryGlowId(null), 2000);
          }
        }
      }, 500);
    }
  }, [highlightId, videos, fromSaved]);

  useEffect(() => {
    if (!activeReelId || videos.length === 0) return;

    const index = videos.findIndex(v => v._id.toString() === activeReelId);
    if (index !== -1 && index < videos.length - 1) {
      const nextVideo = videos[index + 1];

      import("@/lib/video-cache").then(({ VideoCache }) => {
        VideoCache.save(nextVideo._id.toString(), nextVideo.videoUrl);
      });
    }
  }, [activeReelId, videos]);

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

  useEffect(() => {
    const calculateSafeHeight = () => {
      const isMobile = window.innerWidth < 768;
      const TOP_BAR_HEIGHT = isMobile ? 64 : 0;
      const BOTTOM_BAR_HEIGHT = isMobile ? 72 : 0;
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
      className="w-full h-screen md:h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide relative feed-envelope"
    >

      { }
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
              <div className={`w-full h-full md:w-[420px] md:max-h-[85vh] md:aspect-[9/16] relative transition-all duration-500 group ${isHighlighted ? 'md:ring-1 md:ring-[var(--accent)]/50 md:shadow-[0_0_50px_color-mix(in_srgb,var(--accent),transparent_80%)] md:rounded-3xl' : ''
                }`}>
                { }
                <div className="hidden md:block absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                { }
                <div className="hidden md:block absolute -bottom-16 left-8 right-8 h-16 bg-[var(--accent)]/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                { }
                {isMemoryGlow && (
                  <div
                    className="absolute -inset-6 rounded-[48px] -z-10"
                    style={{
                      background: 'linear-gradient(135deg, rgba(45, 226, 166, 0.4), rgba(79, 140, 255, 0.3))',
                      filter: 'blur(30px)',
                      animation: 'memoryPulse 2s ease-out forwards'
                    }}
                  />
                )}

                { }
                {isHighlighted && !isMemoryGlow && (
                  <div className="absolute -inset-6 rounded-[48px] bg-[var(--accent)]/20 blur-2xl -z-10" />
                )}

                <div className="w-full h-full md:rounded-2xl md:overflow-hidden md:shadow-[0_35px_100px_-20px_color-mix(in_srgb,var(--accent),transparent_60%)] relative">
                  { }
                  {Math.abs(index - activeIndex) <= 1 ? (
                    <ReelCard
                      ref={ref}
                      video={video}
                      isActive={activeReelId === videoId}
                      priority={index === 0}
                      onVisibilityChange={() => { }}
                      onVideoDeleted={onVideoDeleted}
                    />
                  ) : (

                    <div className="w-full h-full bg-[#0F1117] flex items-center justify-center">
                      <div className="w-full h-full relative overflow-hidden">
                        { }
                        {video.thumbnailUrl && (
                          <img
                            src={video.thumbnailUrl}
                            alt="Preview"
                            className="w-full h-full object-cover opacity-30 blur-xl scale-110"
                            loading="lazy"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          { }
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
