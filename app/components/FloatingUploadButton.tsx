"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FloatingUploadButton() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [showLightTrail, setShowLightTrail] = useState(false);

  // When hovered, show the light trail connection
  useEffect(() => {
    if (isHovered) {
      setShowLightTrail(true);
    } else {
      // Small delay before hiding
      const timer = setTimeout(() => setShowLightTrail(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isHovered]);

  const handleClick = () => {
    router.push("/upload");
  };

  return (
    <>
      {/* Light Trail SVG - Curved path from center to button */}
      {showLightTrail && (
        <svg
          className="fixed pointer-events-none z-40 animate-light-trail"
          style={{
            bottom: "120px",
            right: "80px",
            width: "200px",
            height: "200px",
          }}
        >
          <defs>
            <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(79, 140, 255, 0)" />
              <stop offset="50%" stopColor="rgba(79, 140, 255, 0.5)" />
              <stop offset="100%" stopColor="rgba(45, 226, 166, 0.8)" />
            </linearGradient>
          </defs>
          <path
            d="M 0 200 Q 80 150 160 40"
            fill="none"
            stroke="url(#trailGradient)"
            strokeWidth="2"
            strokeDasharray="100"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Floating Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed bottom-8 right-8 w-16 h-16 rounded-full text-white flex items-center justify-center z-50 transition-all duration-500 ${isHovered ? "scale-110" : "animate-slow-breath"
          }`}
        style={{
          background: isHovered
            ? "linear-gradient(135deg, #4F8CFF 0%, #2DE2A6 100%)"
            : "#4F8CFF",
          boxShadow: isHovered
            ? "0 0 40px rgba(79, 140, 255, 0.6), 0 0 80px rgba(45, 226, 166, 0.3), 0 8px 32px rgba(0, 0, 0, 0.3)"
            : "0 4px 20px rgba(79, 140, 255, 0.5), 0 8px 32px rgba(0, 0, 0, 0.2)",
        }}
      >
        <Plus
          className={`transition-transform duration-300 ${isHovered ? "rotate-90" : ""}`}
          style={{ width: "28px", height: "28px" }}
          strokeWidth={2.5}
        />

        {/* Tooltip on hover */}
        <div
          className={`absolute right-full mr-4 px-4 py-2 bg-[#171B22]/95 backdrop-blur-md rounded-xl border border-white/10 transition-all duration-300 whitespace-nowrap ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"
            }`}
          style={{
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
          }}
        >
          <span
            className="text-sm text-white font-medium"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Create Reel
          </span>
          <div className="text-xs text-white/50 mt-0.5" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
            Share your story
          </div>
        </div>
      </button>

      {/* Outer glow ring on hover */}
      {isHovered && (
        <div
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full pointer-events-none z-40"
          style={{
            background: "transparent",
            boxShadow: "0 0 0 4px rgba(79, 140, 255, 0.3)",
            animation: "shareRipple 600ms ease-out forwards",
          }}
        />
      )}
    </>
  );
}
