"use client";

import { useNotifications } from "@/app/context/NotificationContext";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

interface NotificationBellProps {
    isActive?: boolean;
    className?: string; // Allow passing classes for layout
}

export default function NotificationBell({ isActive, className = "" }: NotificationBellProps) {
    const { unreadCount, togglePanel, isOpen } = useNotifications();
    const [prevCount, setPrevCount] = useState(unreadCount);
    const [shouldPulse, setShouldPulse] = useState(false);

    useEffect(() => {
        if (unreadCount > prevCount) {
            setShouldPulse(true);
            const timer = setTimeout(() => setShouldPulse(false), 1000); // Reset after pulse
            return () => clearTimeout(timer);
        }
        setPrevCount(unreadCount);
    }, [unreadCount, prevCount]);

    return (
        <button
            onClick={togglePanel}
            className={`relative group flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 ${isOpen || isActive ? 'bg-[#4F8CFF]/10 text-[#4F8CFF]' : 'hover:bg-white/5 text-[#5C6270] hover:text-white'
                } ${className}`}
        >
            {/* Bell Icon */}
            <Bell
                className={`transition-all duration-300 ${isOpen || isActive ? "w-6 h-6 stroke-[2.5px]" : "w-5 h-5 group-hover:w-6 group-hover:h-6"
                    }`}
            />

            {/* The Coral Dot */}
            {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#FF6B6B] rounded-full border-2 border-[#0F1117] animate-[pulse_3s_ease-in-out_infinite] shadow-[0_0_8px_rgba(255,107,107,0.5)]">
                    <span className="absolute inset-0 rounded-full bg-[#FF6B6B] animate-ping opacity-20" />
                </span>
            )}

            {/* Tooltip - positioned to the right */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#171B22]/95 backdrop-blur-md rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100]">
                <span className="text-xs text-white font-medium font-[family-name:var(--font-inter)]">
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                </span>
            </div>
        </button>
    );
}
