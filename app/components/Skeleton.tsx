import React from "react";

interface SkeletonProps {
    className?: string; // For sizing (w, h) and positioning
    shimmerColor?: string; // Optional custom shimmer color
}

/**
 * Skeleton Loading Component
 * 
 * A premium, shimmering placeholder that adapts to the current theme.
 * Uses environmental variables like --bg-card and --bg-hover.
 */
export default function Skeleton({ className = "", shimmerColor }: SkeletonProps) {
    return (
        <div
            className={`relative overflow-hidden bg-[var(--bg-card)] rounded-xl ${className}`}
            style={{
                // Fallback style if classes are missing
                backgroundColor: "var(--bg-card)",
            }}
        >
            {/* Shimmer Effect */}
            <div
                className="absolute inset-0 -translate-x-full animate-skeleton-shimmer"
                style={{
                    backgroundImage: `linear-gradient(
                        90deg, 
                        transparent 0%, 
                        ${shimmerColor || "var(--bg-hover)"} 50%, 
                        transparent 100%
                    )`
                }}
            />
        </div>
    );
}
