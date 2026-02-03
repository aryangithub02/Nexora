import React from "react";

interface SkeletonProps {
    className?: string; 
    shimmerColor?: string; 
}

export default function Skeleton({ className = "", shimmerColor }: SkeletonProps) {
    return (
        <div
            className={`relative overflow-hidden bg-[var(--bg-card)] rounded-xl ${className}`}
            style={{
                
                backgroundColor: "var(--bg-card)",
            }}
        >
            {}
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
