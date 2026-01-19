"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

/**
 * Global Volume Context
 * Manages the volume state across all ReelCards to ensure consistent audio levels.
 * When the user adjusts the volume on one reel, it applies to all reels.
 */

interface VolumeContextType {
    volume: number;       // 0 to 1
    isMuted: boolean;
    setVolume: (val: number) => void;
    toggleMute: () => void;
}

const VolumeContext = createContext<VolumeContextType | undefined>(undefined);

export function VolumeProvider({ children }: { children: React.ReactNode }) {
    // Default perceived volume (0.2 -> ~4% actual power)
    const [volume, setVolumeState] = useState(0.2);
    const [isMuted, setIsMuted] = useState(false);

    // Initial load from local storage
    useEffect(() => {
        try {
            const savedVol = localStorage.getItem("global_volume");
            const savedMute = localStorage.getItem("global_mute");
            if (savedVol !== null) setVolumeState(parseFloat(savedVol));
            if (savedMute !== null) setIsMuted(savedMute === "true");
        } catch (e) {
            console.warn("Failed to load volume settings", e);
        }
    }, []);

    const setVolume = (val: number) => {
        const clamped = Math.min(Math.max(val, 0), 1);
        setVolumeState(clamped);
        setIsMuted(clamped === 0);
        try {
            localStorage.setItem("global_volume", clamped.toString());
            if (clamped > 0) localStorage.setItem("global_mute", "false");
        } catch (e) { }
    };

    const toggleMute = () => {
        const newState = !isMuted;
        setIsMuted(newState);
        try {
            localStorage.setItem("global_mute", newState.toString());
        } catch (e) { }
    };

    return (
        <VolumeContext.Provider value={{ volume, isMuted, setVolume, toggleMute }}>
            {children}
        </VolumeContext.Provider>
    );
}

export function useVolume() {
    const context = useContext(VolumeContext);
    if (context === undefined) {
        throw new Error("useVolume must be used within a VolumeProvider");
    }
    return context;
}
