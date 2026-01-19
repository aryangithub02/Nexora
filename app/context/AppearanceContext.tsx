"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "midnight" | "solar";
export type Accent = "mint" | "aurora" | "coral";
export type Motion = "full" | "reduced";
export type TextScale = "small" | "normal" | "large";

interface AppearanceState {
    theme: Theme;
    accent: Accent;
    motion: Motion;
    textScale: TextScale;
    autoVolumeProtection?: boolean;
}

interface AppearanceContextType extends AppearanceState {
    updateAppearance: (updates: Partial<AppearanceState>) => void;
}

const defaultAppearance: AppearanceState = {
    theme: "dark",
    accent: "mint",
    motion: "full",
    textScale: "normal",
    autoVolumeProtection: true,
};

const accentColors: Record<Accent, string> = {
    mint: "#4ef2b2",
    aurora: "#4d8dff",
    coral: "#ff6b6b",
};

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
    const [appearance, setAppearance] = useState<AppearanceState>(defaultAppearance);
    const [mounted, setMounted] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem("appearance");
            if (stored) {
                setAppearance((prev) => ({ ...prev, ...JSON.parse(stored) }));
            }
        } catch (e) {
            console.warn("Failed to load appearance settings:", e);
        }
        setMounted(true);
    }, []);

    // Apply to DOM whenever appearance changes
    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;

        // Apply data attributes
        root.dataset.theme = appearance.theme;
        root.dataset.motion = appearance.motion;
        root.dataset.text = appearance.textScale;

        // Apply CSS variable for accent
        root.style.setProperty("--accent", accentColors[appearance.accent]);

        // Persist to localStorage
        try {
            localStorage.setItem("appearance", JSON.stringify(appearance));
        } catch (e) {
            console.warn("Failed to save appearance settings:", e);
        }

    }, [appearance, mounted]);

    const updateAppearance = (updates: Partial<AppearanceState>) => {
        setAppearance((prev) => ({ ...prev, ...updates }));
    };

    // Prevent hydration mismatch by returning children immediately
    // The effect will kick in on client side to apply styles.
    // Alternatively, we could block rendering until mounted to avoid flash of unstyled content
    // but for appearance settings, usually a quick shift is acceptable or handled by CSS defaults.

    return (
        <AppearanceContext.Provider value={{ ...appearance, updateAppearance }}>
            {children}
        </AppearanceContext.Provider>
    );
}

export function useAppearance() {
    const context = useContext(AppearanceContext);
    if (!context) {
        throw new Error("useAppearance must be used within an AppearanceProvider");
    }
    return context;
}
