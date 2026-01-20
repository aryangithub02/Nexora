"use client";

import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef, useCallback } from "react";
import { Play, Volume2, VolumeX, UserPlus, UserCheck, Trash2, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Edit, X } from "lucide-react";
import { IVideo } from "@/models/Video";
import { useSession } from "next-auth/react";
import Link from "next/link";
import CommentSheet from "./CommentSheet";
import ShareMenu from "./ShareMenu";
import CaptionSheet from "./CaptionSheet";
import { useVideoCache } from "@/hooks/useVideoCache";
import { useAppearance } from "../context/AppearanceContext";
import { useVolume } from "../context/VolumeContext";
import { useProfileCache } from "@/hooks/useProfileCache";

interface ReelCardProps {
  video: IVideo;
  isActive: boolean;
  onVisibilityChange?: (visible: boolean) => void;
  onVideoDeleted?: (id: string) => void;
  priority?: boolean;
}

export interface ReelCardRef {
  play: () => void;
  pause: () => void;
  mute: () => void;
  unmute: () => void;
  isPlaying: () => boolean;
  isMuted: () => boolean;
}


function HeartParticle({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <div
      className="absolute pointer-events-none animate-particle-drift"
      style={{
        left: x,
        top: y,
        animationDelay: `${delay}ms`,
      }}
    >
      <Heart
        className="text-[#FF6B6B] fill-[#FF6B6B]"
        style={{
          width: "12px",
          height: "12px",
          filter: "drop-shadow(0 0 8px rgba(255, 107, 107, 0.6))",
        }}
      />
    </div>
  );
}

const ReelCard = forwardRef<ReelCardRef, ReelCardProps>(
  ({ video, isActive, onVisibilityChange, onVideoDeleted, priority = false }, ref) => {
    const { src: activeSrc } = useVideoCache(video._id.toString(), video.videoUrl, isActive);
    const { data: session } = useSession();
    const { volume, isMuted, setVolume, toggleMute } = useVolume();
    const { autoVolumeProtection } = useAppearance();

    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayButton, setShowPlayButton] = useState(false);
    const [progress, setProgress] = useState(0);

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (videoRef.current) {
        let targetVolume = volume * volume;

        if (autoVolumeProtection && targetVolume > 0.85) {
          targetVolume = 0.85;
        }

        videoRef.current.volume = targetVolume;
        videoRef.current.muted = isMuted;
      }
    }, [volume, isMuted, autoVolumeProtection]);

    const resetVolumeTimer = useCallback(() => {
      setShowVolumeSlider(true);
      if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
      volumeTimeoutRef.current = setTimeout(() => {
        setShowVolumeSlider(false);
      }, 3000);
    }, []);

    useEffect(() => {
      return () => {
        if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
      };
    }, []);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isRailActive, setIsRailActive] = useState(true);
    const railTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [loadingFollow, setLoadingFollow] = useState(false);
    const creatorProfile = useProfileCache(video.uploadedBy?._id?.toString());
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);
    const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });
    const [heartParticles, setHeartParticles] = useState<{ x: number; y: number; delay: number }[]>([]);
    const [likeAnimating, setLikeAnimating] = useState(false);
    const lastTapRef = useRef<number>(0);

    // ===== COMMENT STATE =====
    const [commentCount, setCommentCount] = useState(0);
    const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);

    const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
    const [showSentBadge, setShowSentBadge] = useState(false);

    const [isBookmarked, setIsBookmarked] = useState(false);
    const [bookmarkAnimating, setBookmarkAnimating] = useState(false);
    const [showBorderGlow, setShowBorderGlow] = useState(false);

    const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(video.title);
    const [editDescription, setEditDescription] = useState(video.description || "");
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const [isCaptionSheetOpen, setIsCaptionSheetOpen] = useState(false);
    const previousVolumeRef = useRef(1);

    useImperativeHandle(ref, () => ({
      play: () => {
        videoRef.current?.play().catch(() => {
          setIsPlaying(false);
          setShowPlayButton(true);
        });
        setIsPlaying(true);
      },
      pause: () => {
        videoRef.current?.pause();
        setIsPlaying(false);
      },
      mute: () => {
        if (videoRef.current) {
          videoRef.current.muted = true;
          if (!isMuted) toggleMute();
        }
      },
      unmute: () => {
        if (videoRef.current) {
          videoRef.current.muted = false;
          if (isMuted) toggleMute();
        }
      },
      isPlaying: () => isPlaying,
      isMuted: () => isMuted,
    }));

    useEffect(() => {
      const fetchInteractionStates = async () => {
        if (!video._id) return;
        const videoId = video._id.toString();

        try {
          const likeRes = await fetch(`/api/likes?videoId=${videoId}`);
          if (likeRes.ok) {
            const data = await likeRes.json();
            setIsLiked(data.isLiked);
            setLikeCount(data.likeCount);
          }
        } catch (error) {
          console.error("Failed to fetch like status", error);
        }

        try {
          const commentRes = await fetch(`/api/comments?videoId=${videoId}&limit=1`);
          if (commentRes.ok) {
            const data = await commentRes.json();
            setCommentCount(data.totalCount || 0);
          }
        } catch (error) {
          console.error("Failed to fetch comment count", error);
        }

        try {
          const bookmarkRes = await fetch(`/api/bookmarks?videoId=${videoId}`);
          if (bookmarkRes.ok) {
            const data = await bookmarkRes.json();
            setIsBookmarked(data.isBookmarked);
          }
        } catch (error) {
          console.error("Failed to fetch bookmark status", error);
        }
      };

      if (session?.user) {
        fetchInteractionStates();
      }
    }, [video._id, session?.user]);

    useEffect(() => {
      const checkFollowStatus = async () => {
        if (!video.uploadedBy?._id) return;
        try {
          const res = await fetch(`/api/follow?targetId=${video.uploadedBy._id}`);
          if (res.ok) {
            const data = await res.json();
            setIsFollowing(data.isFollowing);
          }
        } catch (error) {
          console.error("Failed to check follow status", error);
        }
      };

      checkFollowStatus();
    }, [video.uploadedBy?._id]);



    const triggerLikeAnimation = useCallback((x: number, y: number) => {
      setHeartPosition({ x, y });
      setShowHeartAnimation(true);
      setLikeAnimating(true);

      const particles = [];
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: x + (Math.random() - 0.5) * 60,
          y: y + (Math.random() - 0.5) * 40,
          delay: i * 100,
        });
      }
      setHeartParticles(particles);

      setTimeout(() => setShowHeartAnimation(false), 900);
      setTimeout(() => setHeartParticles([]), 1500);
      setTimeout(() => setLikeAnimating(false), 500);
    }, []);

    const handleDoubleTap = useCallback(async (e: React.MouseEvent | React.TouchEvent) => {
      const now = Date.now();
      const tapGap = now - lastTapRef.current;
      lastTapRef.current = now;

      if (tapGap < 300 && tapGap > 0) {
        // Double tap detected!
        e.preventDefault();

        // Get tap position
        let x, y;
        if ("touches" in e) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
          } else {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
          }
        } else {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
          } else {
            x = e.clientX;
            y = e.clientY;
          }
        }

        // Only like if not already liked
        if (!isLiked) {
          // Optimistic update
          setIsLiked(true);
          setLikeCount(prev => prev + 1);

          // Trigger animation at tap point
          triggerLikeAnimation(x, y);

          // Update server
          try {
            await fetch("/api/likes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ videoId: video._id?.toString() }),
            });
          } catch (error) {
            // Revert on error
            setIsLiked(false);
            setLikeCount(prev => prev - 1);
            console.error("Failed to like:", error);
          }
        } else {
          // Already liked, just show animation
          triggerLikeAnimation(x, y);
        }
      }
    }, [isLiked, video._id, triggerLikeAnimation]);

    const handleLikeButton = async () => {
      if (!session?.user) return;

      // Optimistic update
      const previousState = isLiked;
      setIsLiked(!previousState);
      setLikeCount(prev => previousState ? prev - 1 : prev + 1);

      if (!previousState) {
        setLikeAnimating(true);
        setTimeout(() => setLikeAnimating(false), 200);
      }

      try {
        const method = previousState ? "DELETE" : "POST";
        await fetch("/api/likes", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: video._id?.toString() }),
        });
      } catch (error) {
        // Revert on error
        setIsLiked(previousState);
        setLikeCount(prev => previousState ? prev + 1 : prev - 1);
        console.error("Failed to toggle like:", error);
      }
    };

    // ===== BOOKMARK HANDLERS =====
    const handleBookmark = async () => {
      if (!session?.user) return;

      // Optimistic update
      const previousState = isBookmarked;
      setIsBookmarked(!previousState);

      if (!previousState) {
        setBookmarkAnimating(true);
        setShowBorderGlow(true);
        setTimeout(() => setBookmarkAnimating(false), 500);
        setTimeout(() => setShowBorderGlow(false), 1000);
      }

      try {
        const method = previousState ? "DELETE" : "POST";
        await fetch("/api/bookmarks", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: video._id?.toString() }),
        });
      } catch (error) {
        // Revert on error
        setIsBookmarked(previousState);
        console.error("Failed to toggle bookmark:", error);
      }
    };

    const handleFollowToggle = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!video.uploadedBy?._id || loadingFollow) return;

      setLoadingFollow(true);

      // Optimistic update
      const previousState = isFollowing;
      setIsFollowing(!previousState);

      try {
        const method = previousState ? "DELETE" : "POST";
        const res = await fetch("/api/follow", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetId: video.uploadedBy._id }),
        });

        if (!res.ok) {
          throw new Error("Failed to toggle follow");
        }
      } catch (error) {
        console.error("Follow error:", error);
        // Revert optimistic update
        setIsFollowing(previousState);
      } finally {
        setLoadingFollow(false);
      }
    };

    const handleDelete = async () => {
      if (!confirm("Are you sure you want to delete this reel?")) return;

      try {
        const res = await fetch(`/api/videos/${video._id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          if (onVideoDeleted) {
            onVideoDeleted(video._id.toString());
          }
        } else {
          console.error("Failed to delete video");
          alert("Failed to delete video");
        }
      } catch (error) {
        console.error("Error deleting video", error);
        alert("Error deleting video");
      }
    };

    const handleUpdateVideo = async () => {
      if (!editTitle.trim()) return;

      setIsSavingEdit(true);
      try {
        const res = await fetch(`/api/videos/${video._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editTitle,
            description: editDescription
          })
        });

        if (res.ok) {
          // Ideally update local state or revalidate
          // For now, we wait for a refresh or optimistic update if we had one
          // Simple hack: Update the video object in place if possible or just close
          setIsEditing(false);
          // Force a reload or notify parent? 
          // Since video prop is immutable, we can't easily change it without parent update.
          // However, we can display the edited values locally if we prefer.
          // Or just reload the page/component.
          window.location.reload(); // Simplest for now
        } else {
          alert("Failed to update video");
        }
      } catch (error) {
        console.error("Error updating video", error);
        alert("Error updating video");
      } finally {
        setIsSavingEdit(false);
      }
    };

    // ===== CAPTION SHEET HANDLERS =====
    const handleOpenCaptionSheet = () => {
      // Store current volume and reduce to 30%
      if (videoRef.current) {
        previousVolumeRef.current = videoRef.current.volume;
        videoRef.current.volume = 0.3;
      }
      setIsCaptionSheetOpen(true);
    };

    const handleCloseCaptionSheet = () => {
      // Restore previous volume
      if (videoRef.current) {
        videoRef.current.volume = previousVolumeRef.current;
      }
      setIsCaptionSheetOpen(false);
    };

    // Auto-play/pause based on active state
    useEffect(() => {
      if (isActive && videoRef.current) {
        // Prepare for playback
        videoRef.current.currentTime = 0;

        // Volume Prep
        let targetVolume = volume * volume;
        if (autoVolumeProtection && targetVolume > 0.85) targetVolume = 0.85;

        // If protection is on and not muted, start at 0 and fade in
        if (autoVolumeProtection && !isMuted) {
          videoRef.current.volume = 0;
        } else {
          videoRef.current.volume = targetVolume;
        }

        // Attempt to play
        const playPromise = videoRef.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Auto-play started!
              setIsPlaying(true);
              setShowPlayButton(false);

              // Fade In Logic
              if (autoVolumeProtection && !isMuted) {
                const fadeDuration = 300; // ms
                const steps = 10;
                const stepTime = fadeDuration / steps;
                const volumeStep = targetVolume / steps;
                let currentStep = 0;

                const fadeInterval = setInterval(() => {
                  currentStep++;
                  if (!videoRef.current) { // Safety check
                    clearInterval(fadeInterval);
                    return;
                  }

                  // Calculate next volume
                  const nextVol = Math.min(volumeStep * currentStep, targetVolume);
                  videoRef.current.volume = nextVol;

                  if (currentStep >= steps) {
                    clearInterval(fadeInterval);
                    // Ensure final value is exact
                    videoRef.current.volume = targetVolume;
                  }
                }, stepTime);
              }
            })
            .catch((error) => {
              // Ignore AbortError (interrupted by pause)
              if (error.name === "AbortError") return;

              // Auto-play was prevented.
              setIsPlaying(false);
              setShowPlayButton(true);
            });
        }
      } else {
        videoRef.current?.pause();
        setIsPlaying(false);
      }
    }, [isActive]);



    // One correction: `isMuted` is also needed. If I toggle mute while inactive, then become active.
    // Since `isActive` changes, it uses fresh state. Correct.





    // Update progress and time
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const updateProgress = () => {
        if (video.duration) {
          setProgress((video.currentTime / video.duration) * 100);
          setCurrentTime(video.currentTime);
          setDuration(video.duration);
        }
      };

      video.addEventListener("timeupdate", updateProgress);
      video.addEventListener("loadedmetadata", updateProgress);
      return () => {
        video.removeEventListener("timeupdate", updateProgress);
        video.removeEventListener("loadedmetadata", updateProgress);
      };
    }, []);

    const handlePlayPause = () => {
      resetRailTimer(); // Wake the rail
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
          setShowPlayButton(true);
        } else {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch((e) => {
              if (e.name === "AbortError") return;
              console.error("Play failed:", e);
              setIsPlaying(false);
              setShowPlayButton(true);
            });
          }
          setIsPlaying(true);
          setShowPlayButton(false);
        }
      }
    };

    const handleVolumeToggle = () => {
      toggleMute();
    };

    const getCreatorInitial = (email: string | undefined) => {
      if (!email) return "U";
      return email.charAt(0).toUpperCase();
    };

    const formatCount = (count: number) => {
      if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
      if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
      return count.toString();
    };

    const formatTime = (seconds: number) => {
      if (!seconds || isNaN(seconds)) return "0:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const resetRailTimer = useCallback(() => {
      setIsRailActive(true);
      if (railTimeoutRef.current) clearTimeout(railTimeoutRef.current);
      railTimeoutRef.current = setTimeout(() => {
        setIsRailActive(false);
      }, 3000);
    }, []);

    useEffect(() => {
      resetRailTimer();
      return () => {
        if (railTimeoutRef.current) clearTimeout(railTimeoutRef.current);
      };
    }, [resetRailTimer]);

    // ===== VIDEO ERROR STATE =====
    const [videoError, setVideoError] = useState(false);



    const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      console.warn("VIDEO ERROR:", {
        url: video.videoUrl,
        activeSrc: activeSrc,
        error: e.currentTarget.error,
        networkState: e.currentTarget.networkState,
        readyState: e.currentTarget.readyState
      });
      setVideoError(true);
      setIsPlaying(false);
      setShowPlayButton(false);
    };

    // Debug Log
    useEffect(() => {
      if (isActive) {
        console.log("ReelCard Active:", {
          id: video._id,
          title: video.title,
          originalUrl: video.videoUrl,
          cachedSrc: activeSrc
        });
      }
    }, [isActive, video, activeSrc]);

    if (videoError || !activeSrc) {
      return (
        <div
          ref={containerRef}
          className="relative mx-auto bg-[#0F1117] flex items-center justify-center border border-white/10 rounded-xl overflow-hidden w-full h-full aspect-[9/16] max-w-[500px]"
        >
          <div className="text-center p-6 opacity-50">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <VolumeX className="w-8 h-8 text-white/50" />
            </div>
            <p className="text-white font-medium mb-1">Video Unavailable</p>
            <p className="text-xs text-[#5C6270]">Source could not be loaded</p>
          </div>
        </div>
      );
    }

    return (
      <>
        <div
          ref={containerRef}
          className={`relative mx-auto ${showBorderGlow ? 'animate-border-glow' : ''} w-full h-full aspect-[9/16] max-w-[500px] flex flex-col bg-[var(--bg-card)] md:rounded-2xl md:overflow-hidden`}
          onClick={handleDoubleTap}
          onTouchStart={handleDoubleTap}
        >
          {/* Logic truncated for brevity, assume full render logic */}
          {/* THIS IS A PATCH APPLICATION - IT DOES NOT MATTER AS WE ARE ONLY WRAPPING THE EXPORT */}
          {/* Wait, multi_replace cannot wrap the entire component easily. */}
          {/* I should just change the export statement at the bottom if possible, or wrap the definition */}
          {/* The definition starts at line 54. */}

          {/* ===== REEL HEADER (Identity Strip - Desktop Only) ===== */}
          <div
            className="reel-header hidden md:flex h-[40px] w-full items-center gap-2 px-3 flex-shrink-0 backdrop-blur-md"
            style={{
              background: "var(--glass)",
              borderBottom: "1px solid var(--border-soft)",
            }}
          >
            {/* Avatar */}
            <Link
              href={`/profile/${video.uploadedBy?._id}`}
              className="flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-7 h-7 rounded-full p-[1px]" style={{ background: "var(--accent)" }}>
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                  {(video.uploadedBy?.avatarUrl || creatorProfile?.avatarUrl) ? (
                    <img
                      src={video.uploadedBy?.avatarUrl || creatorProfile?.avatarUrl}
                      alt={video.uploadedBy?.displayName || creatorProfile?.displayName || 'Creator'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-[10px] font-bold">
                      {getCreatorInitial(video.uploadedBy?.email)}
                    </span>
                  )}
                </div>
              </div>
            </Link>

            {/* Creator Name */}
            <Link
              href={`/profile/${video.uploadedBy?._id}`}
              className="min-w-0 flex-1"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[var(--text-main)] text-xs font-medium hover:text-[var(--accent)] transition-colors truncate block">
                {video.uploadedBy?.displayName || creatorProfile?.displayName || video.uploadedBy?.email?.split("@")[0] || "Creator"}
              </span>
            </Link>

            {/* Follow Button */}
            {video.uploadedBy?._id && session?.user && (session.user as any).id !== video.uploadedBy._id.toString() && (
              <button
                className={`ml-auto px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-300 flex-shrink-0 ${isFollowing
                  ? "bg-white/10 text-white/50"
                  : "bg-[var(--accent)] text-[#0F1117]"
                  }`}
                onClick={handleFollowToggle}
                disabled={loadingFollow}
              >
                {loadingFollow ? "..." : isFollowing ? "Following" : "Follow"}
              </button>
            )}

            {/* Options Menu Button (3 dots) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOptionsMenuOpen(true);
              }}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/70 transition-colors ml-1"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>


          {/* Edit Video Overlay */}
          {isEditing && (
            <div
              className="absolute inset-0 z-[70] bg-[#0F1117] flex flex-col animate-in slide-in-from-bottom duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-white font-medium">Edit Reel</h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>

              {/* Form */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#9AA0AA] uppercase tracking-wider">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-[#171B22] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#5C6270] focus:outline-none focus:border-[var(--accent)] transition-colors"
                    placeholder="Enter a catchy title..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#9AA0AA] uppercase tracking-wider">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={5}
                    className="w-full bg-[#171B22] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#5C6270] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                    placeholder="What is this video about?"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-[#0F1117]">
                <button
                  onClick={handleUpdateVideo}
                  disabled={isSavingEdit || !editTitle.trim()}
                  className="w-full py-3 rounded-xl bg-[var(--accent)] text-[#0F1117] font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* Options Menu Overlay */}
          {isOptionsMenuOpen && (
            <div
              className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
              onClick={(e) => {
                e.stopPropagation();
                setIsOptionsMenuOpen(false);
              }}
            >
              <div
                className="bg-[#171B22] border border-white/10 rounded-2xl w-[80%] max-w-[300px] overflow-hidden shadow-2xl scale-in-95 animate-in duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-white font-medium">Options</h3>
                  <button
                    onClick={() => setIsOptionsMenuOpen(false)}
                    className="p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/50" />
                  </button>
                </div>

                <div className="p-2 space-y-1">
                  {/* Save Option */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookmark();
                      setIsOptionsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 rounded-xl transition-colors text-left"
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-white" : ""}`} />
                    <span>{isBookmarked ? "Unsave Reel" : "Save Reel"}</span>
                  </button>

                  {/* Owner Only Options */}
                  {session?.user && video.uploadedBy?._id && (session.user as any).id === video.uploadedBy._id.toString() && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOptionsMenuOpen(false);
                          setIsEditing(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 rounded-xl transition-colors text-left"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit Details</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOptionsMenuOpen(false);
                          handleDelete();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-xl transition-colors text-left"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Reel</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== REEL STAGE (Video + Caption) ===== */}
          <div
            className={`reel-stage relative w-full h-[90%] md:h-auto md:flex-1 overflow-hidden ${isShareMenuOpen ? 'animate-reel-shrink' : ''}`}
            style={{
              background: "var(--bg-main)",
            }}
          >


            {/* LCP Optimization: Thumbnail Overlay */}
            {/* Show until video plays to ensure immediate paint */}
            <div className={`absolute inset-0 z-10 transition-opacity duration-700 ${isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full md:object-cover object-contain bg-black"
                loading={priority ? "eager" : "lazy"}
                // @ts-ignore - fetchPriority is standard but React types catch up slowly
                fetchPriority={priority ? "high" : "auto"}
              />
              {/* Dark gradient for text readability (matches video overlay) */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 opacity-60" />
            </div>

            {/* Video - The brightest object on screen */}
            <video
              ref={videoRef}
              src={activeSrc}
              poster={video.thumbnailUrl} // Native fallback
              className="w-full h-full relative z-0 md:object-cover object-contain bg-black"
              // objectFit handled by class
              playsInline
              muted={isMuted}
              loop
              preload="metadata"
              onError={handleVideoError}
              onPlay={() => {
                setIsPlaying(true);
                setShowPlayButton(false);
              }}
              onPause={() => {
                setIsPlaying(false);
                setShowPlayButton(true);
              }}
              onLoadedMetadata={() => {
                // Volume will be handled by useEffect
              }}
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
            />

            {/* Volume Slider Capsule - Top Right (All Viewports) */}
            <div
              className={`absolute top-[36px] right-2 md:top-2 md:right-4 z-40 flex items-center gap-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 transition-all duration-300 ${showVolumeSlider ? "pr-3 pl-3 bg-black/80 border-white/20" : "pr-1.5 pl-1.5"
                }`}
            >
              {/* Left Icon (Mute/Low) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (showVolumeSlider) {
                    toggleMute(); // Use Global Toggle
                    resetVolumeTimer();
                  } else {
                    resetVolumeTimer();
                  }
                }}
                className="p-1 rounded-full hover:bg-white/10 flex-shrink-0 transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-white/70" strokeWidth={2} />
                ) : (
                  <Volume2 className="w-4 h-4 text-white" strokeWidth={2} />
                )}
              </button>

              {/* Slider Container */}
              <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${showVolumeSlider ? "w-[120px] opacity-100 ml-1" : "w-0 opacity-0 ml-0"}`}>
                {/* Range Input with Green Progress Fill */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    resetVolumeTimer();
                    const newVol = parseFloat(e.target.value);
                    setVolume(newVol); // Global Set
                    if (videoRef.current) {
                      // Apply square law immediately for responsiveness during drag
                      videoRef.current.volume = newVol * newVol;
                      videoRef.current.muted = newVol === 0;
                    }
                  }}
                  style={{
                    background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`
                  }}
                  className="flex-1 h-1 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                />

                {/* Right Icon (Max) */}
                <Volume2 className="w-3.5 h-3.5 text-white/50 flex-shrink-0" strokeWidth={2} />
              </div>
            </div>

            {/* Heart Bloom Animation (on double-tap) */}
            {showHeartAnimation && (
              <div
                className="absolute pointer-events-none z-30 animate-heart-bloom"
                style={{
                  left: heartPosition.x - 40,
                  top: heartPosition.y - 40,
                }}
              >
                <Heart
                  className="text-[#FF6B6B] fill-[#FF6B6B]"
                  style={{
                    width: "80px",
                    height: "80px",
                    filter: "drop-shadow(0 0 20px rgba(255, 107, 107, 0.8))",
                  }}
                />
              </div>
            )}

            {/* Heart Particles */}
            {heartParticles.map((particle, index) => (
              <HeartParticle key={index} x={particle.x} y={particle.y} delay={particle.delay} />
            ))}



            {/* Center Layer: Play Button */}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none z-20 ${showPlayButton && !isPlaying ? "opacity-100" : "opacity-0"
                }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayPause();
                }}
                className="pointer-events-auto bg-black/40 backdrop-blur-xl rounded-full p-6 hover:bg-black/60 hover:scale-110 transition-all duration-300 border border-white/10"
                style={{
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
              >
                <Play className="w-12 h-12 text-white ml-1" strokeWidth={2} />
              </button>
            </div>

            {/* ===== CAPTION CHAMBER (Desktop Only) ===== */}
            {/* Tap to expand into full context */}
            <div
              className={`hidden md:block absolute bottom-0 left-0 right-0 z-30 caption-veil cursor-pointer transition-opacity duration-300 ${isCaptionSheetOpen ? 'opacity-50' : 'opacity-100'}`}
              style={{ height: "35%" }}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenCaptionSheet();
              }}
            >
              <div className="absolute bottom-4 left-3 right-16 pb-[env(safe-area-inset-bottom)] pointer-events-auto">
                {/* Title - Bold and readable */}
                <h2
                  className="font-bold text-base mb-1.5 line-clamp-1 text-white"
                  style={{
                    fontFamily: "var(--font-space-grotesk)",
                    textShadow: "0 2px 12px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  {video.title}
                </h2>

                {/* Description - Clear against the veil */}
                <p
                  className="text-sm line-clamp-2 leading-relaxed text-white/85"
                  style={{
                    fontFamily: "var(--font-inter)",
                    textShadow: "0 1px 4px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  {video.description}
                  {video.description && video.description.length > 50 && (
                    <span className="opacity-50 ml-1 text-white/50">... more</span>
                  )}
                </p>
              </div>
            </div>

            {/* ===== FIX #2: CONTROL RAIL ===== */}
            {/* Glass strip anchored to the reel's right edge */}
            {/* ===== FIX #2: CONTROL RAIL ===== */}
            {/* Glass strip anchored to the reel's right edge - The Translucent Bolt */}
            <div
              className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 control-rail rounded-[20px] py-4 px-1 flex flex-col items-center backdrop-blur-xl transition-all duration-500 ${isRailActive ? 'opacity-100 translate-x-0' : 'opacity-40 translate-x-1.5'
                }`}
              style={{
                width: "44px",
                background: "var(--glass)",
                border: "1px solid var(--border-soft)",
                boxShadow: "var(--shadow-soft)",
              }}
              onMouseEnter={resetRailTimer}
              onTouchStart={resetRailTimer}
              onClick={resetRailTimer}
            >
              {/* Like & Comment Group */}
              <div className="flex flex-col items-center gap-3">
                {/* Like */}
                <div className="flex flex-col items-center gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLikeButton();
                      resetRailTimer();
                    }}
                    className={`p-2 rounded-full transition-all duration-300 ${likeAnimating ? 'animate-like-pulse' : ''}`}
                    style={{
                      background: "transparent",
                    }}
                  >
                    <Heart
                      className={`w-7 h-7 transition-all duration-300 ${isLiked ? 'text-[#FF6B6B] fill-[#FF6B6B]' : 'text-white'}`}
                      strokeWidth={2}
                    />
                  </button>
                  <span
                    className={`text-white/80 text-[10px] font-medium ${likeAnimating ? 'animate-counter-spring' : ''}`}
                    style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                  >
                    {formatCount(likeCount)}
                  </span>
                </div>

                {/* Comment */}
                <div className="flex flex-col items-center gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCommentSheetOpen(true);
                      resetRailTimer();
                    }}
                    className="p-2 rounded-full hover:bg-[var(--bg-hover)] transition-all"
                  >
                    <MessageCircle className="w-6 h-6 text-[var(--text-main)]" strokeWidth={2} />
                  </button>
                  <span
                    className="text-[var(--text-muted)] text-[10px] font-medium"
                    style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                  >
                    {formatCount(commentCount)}
                  </span>
                </div>
              </div>

              {/* Spacer */}
              <div className="h-4" />

              {/* Share & Bookmark Group */}
              <div className="flex flex-col items-center gap-3">
                {/* Share */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsShareMenuOpen(true);
                    resetRailTimer();
                  }}
                  className="p-2 rounded-full hover:bg-white/10 transition-all relative group"
                >
                  <Share2 className="w-5 h-5 text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all" strokeWidth={2} />
                  {showSentBadge && (
                    <div className="absolute -top-1 -right-1 animate-sent-pulse">
                      <div className="px-1.5 py-0.5 rounded-full bg-[var(--accent)] text-[#0F1117] text-[8px] font-bold">
                        ✓
                      </div>
                    </div>
                  )}
                </button>

                {/* Bookmark */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBookmark();
                    resetRailTimer();
                  }}
                  className={`p-2 rounded-full transition-all duration-300 ${bookmarkAnimating ? 'animate-bookmark-fill' : ''}`}
                >
                  <Bookmark
                    className={`w-5 h-5 transition-all duration-300 ${isBookmarked ? 'text-[var(--accent)] fill-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
                    strokeWidth={2}
                  />
                </button>
              </div>


            </div>

            {/* Desktop Bottom Controls (Slider + Timer) - Appears on Hover */}
            <div className="absolute bottom-0 left-0 right-0 p-3 pt-6 bg-gradient-to-t from-black/80 to-transparent z-30 transition-opacity duration-300 opacity-0 group-hover:opacity-100 hidden md:flex items-center gap-3">

              {/* Slider */}
              <div className="flex-1 h-1 relative flex items-center group/slider hover:h-1.5 transition-all">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={progress}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    const newProgress = parseFloat(e.target.value);
                    setProgress(newProgress);
                    if (videoRef.current && videoRef.current.duration) {
                      const newTime = (newProgress / 100) * videoRef.current.duration;
                      videoRef.current.currentTime = newTime;
                    }
                  }}
                  className="w-full h-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:h-0 group-hover/slider:[&::-webkit-slider-thumb]:w-2.5 group-hover/slider:[&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:transition-all"
                  style={{
                    background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${progress}%, rgba(255,255,255,0.3) ${progress}%, rgba(255,255,255,0.3) 100%)`
                  }}
                />
              </div>

              {/* Time & Duration */}
              <div className="flex-shrink-0">
                <span className="text-[10px] text-white/90 font-medium tracking-wider" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* ===== MOBILE OVERLAY (md:hidden) ===== */}
            {/* Logo, Account Name, Follow, Caption inside the video area */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent md:hidden flex flex-col gap-3 z-20">
              <div className="flex items-center gap-3">
                {/* Logo/Avatar */}
                <Link href={`/profile/${video.uploadedBy?._id}`} onClick={(e) => e.stopPropagation()}>
                  <div className="w-10 h-10 rounded-full p-[1.5px]" style={{ background: "var(--accent)" }}>
                    <div className="w-full h-full rounded-full bg-black overflow-hidden">
                      {creatorProfile?.avatarUrl ? (
                        <img
                          src={creatorProfile.avatarUrl}
                          className="w-full h-full object-cover"
                          alt="Creator"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-white font-bold">
                          {getCreatorInitial(video.uploadedBy?.email)}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Account Name & Follow */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${video.uploadedBy?._id}`} onClick={(e) => e.stopPropagation()}>
                      <span className="text-white font-bold text-shadow-sm shadow-black">
                        {creatorProfile?.username || video.uploadedBy?.email?.split("@")[0] || "user"}
                      </span>
                    </Link>
                    {video.uploadedBy?._id && session?.user && (session.user as any).id !== video.uploadedBy._id.toString() && (
                      <button
                        className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${isFollowing ? 'bg-white/20 text-white/80' : 'bg-[var(--accent)] text-[#0F1117]'
                          }`}
                        onClick={handleFollowToggle}
                        disabled={loadingFollow}
                      >
                        {loadingFollow ? "..." : isFollowing ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Caption & Description */}
              <div className="flex flex-col gap-1">
                <h2 className="text-white font-bold text-sm line-clamp-1">{video.title}</h2>
                <p className="text-white/90 text-xs leading-relaxed line-clamp-2" onClick={handleOpenCaptionSheet}>
                  {video.description}
                </p>
              </div>

              {/* Mobile Progress Slider (Below Description) */}
              <div className="w-full mt-2 flex items-center gap-3">
                {/* Slider */}
                <div className="flex-1 h-4 relative flex items-center group">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={progress}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      const newProgress = parseFloat(e.target.value);
                      setProgress(newProgress);
                      if (videoRef.current && videoRef.current.duration) {
                        const newTime = (newProgress / 100) * videoRef.current.duration;
                        videoRef.current.currentTime = newTime;
                      }
                    }}
                    className="w-full h-1 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:transition-all"
                    style={{
                      background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${progress}%, rgba(255,255,255,0.3) ${progress}%, rgba(255,255,255,0.3) 100%)`
                    }}
                  />
                </div>

                {/* Time Display - Mobile */}
                <div className="flex-shrink-0">
                  <span className="text-[10px] text-white/70 font-medium tracking-wider" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== MOBILE SPACE & CONTROL BAR (md:hidden) ===== */}

          {/* 10% Space */}
          <div className="h-[10%] w-full bg-[var(--bg-main)] md:hidden" />


        </div>

        {/* Comment Sheet */}
        <CommentSheet
          videoId={video._id?.toString() || ""}
          videoOwnerId={video.uploadedBy?._id?.toString()}
          isOpen={isCommentSheetOpen}
          onClose={() => setIsCommentSheetOpen(false)}
          commentPermission={video.uploadedBy?.commentPermission}
          isFollowing={isFollowing}
        />

        {/* Share Menu */}
        <ShareMenu
          videoId={video._id?.toString() || ""}
          isOpen={isShareMenuOpen}
          onClose={() => {
            setIsShareMenuOpen(false);
            setShowSentBadge(true);
            setTimeout(() => setShowSentBadge(false), 1500);
          }}
        />

        {/* Caption Sheet */}
        {isCaptionSheetOpen && (
          <CaptionSheet
            video={video}
            creatorProfile={creatorProfile}
            likeCount={likeCount}
            commentCount={commentCount}
            onClose={handleCloseCaptionSheet}
            onOpenComments={() => setIsCommentSheetOpen(true)}
          />
        )}
      </>
    );
  }
);

ReelCard.displayName = "ReelCard";

export default React.memo(ReelCard);
