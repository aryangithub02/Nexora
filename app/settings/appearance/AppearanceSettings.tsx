"use client";

import {
    Palette,
    Moon,
    Sun,
    Sparkles,
    Zap,
    Type,
    Check
} from "lucide-react";
import { useAppearance, Theme, Accent, Motion, TextScale } from "@/app/context/AppearanceContext";

interface ThemeOption {
    id: Theme;
    label: string;
    description: string;
    preview: {
        bg: string;
        accent: string;
    };
}

interface AccentOption {
    id: Accent;
    label: string;
    color: string;
    glow: string;
}

export default function AppearanceSettings() {
    const { theme, accent, motion, textScale, updateAppearance } = useAppearance();

    const themes: ThemeOption[] = [
        {
            id: "dark",
            label: "Dark",
            description: "The default experience",
            preview: { bg: "bg-[#0F1117]", accent: "border-[#2DE2A6]" }
        },
        {
            id: "midnight",
            label: "Midnight",
            description: "Deeper, richer darkness",
            preview: { bg: "bg-[#050508]", accent: "border-[#4F8CFF]" }
        },
        {
            id: "solar",
            label: "Solar Dusk",
            description: "Warm, cinematic evening",
            preview: { bg: "bg-[#1b120a]", accent: "border-[#F4D03F]" }
        }
    ];

    const accents: AccentOption[] = [
        { id: "mint", label: "Mint", color: "#4ef2b2", glow: "shadow-[0_0_20px_rgba(78,242,178,0.3)]" },
        { id: "aurora", label: "Aurora", color: "#4d8dff", glow: "shadow-[0_0_20px_rgba(77,141,255,0.3)]" },
        { id: "coral", label: "Coral", color: "#ff6b6b", glow: "shadow-[0_0_20px_rgba(255,107,107,0.3)]" }
    ];

    const getAccentColorValue = () => {
        return accents.find(a => a.id === accent)?.color || "#4ef2b2";
    };

    return (
        <div className="space-y-12 relative z-10">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
                    Appearance
                </h1>
                <p className="text-sm text-[#5C6270] mt-1 font-[family-name:var(--font-inter)]">
                    Personalize how the app looks and feels
                </p>
            </div>

            {/* Live Preview Indicator */}
            <div
                className="bg-gradient-to-r from-[#4F8CFF]/10 to-[#2DE2A6]/10 rounded-xl border border-white/5 p-4 flex items-center gap-3"
                style={{ borderColor: `${getAccentColorValue()}20` }}
            >
                <div
                    className="w-3 h-3 rounded-full animate-pulse"
                    style={{ backgroundColor: getAccentColorValue() }}
                />
                <p className="text-sm text-white/70 font-[family-name:var(--font-inter)]">
                    Changes apply instantly — no save needed
                </p>
            </div>

            {/* Theme Selection */}
            <section className="space-y-6">
                <h2 className="text-xs font-bold text-[#5C6270] uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">
                    Theme
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {themes.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => updateAppearance({ theme: t.id })}
                            className={`relative group rounded-2xl border-2 p-1 transition-all duration-300 ${theme === t.id
                                ? `${t.preview.accent} shadow-lg`
                                : "border-[#2A2F3A] hover:border-[#3A3F4A]"
                                }`}
                            style={{
                                borderColor: theme === t.id ? getAccentColorValue() : undefined
                            }}
                        >
                            {/* Theme Preview Card */}
                            <div className={`${t.preview.bg} rounded-xl p-4 h-32 flex flex-col justify-between`}>
                                {/* Mini UI Preview */}
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-white/10" />
                                    <div className="h-2 w-12 rounded bg-white/20" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-full rounded bg-white/10" />
                                    <div className="h-2 w-2/3 rounded bg-white/10" />
                                </div>
                            </div>

                            {/* Label */}
                            <div className="p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-white font-medium text-left">{t.label}</p>
                                        <p className="text-xs text-[#5C6270] text-left">{t.description}</p>
                                    </div>
                                    {theme === t.id && (
                                        <div
                                            className="w-6 h-6 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: getAccentColorValue() }}
                                        >
                                            <Check className="w-4 h-4 text-[#0F1117]" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {/* Accent Color */}
            <section className="space-y-6">
                <h2 className="text-xs font-bold text-[#5C6270] uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">
                    Accent Color
                </h2>

                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5">
                    <div className="flex items-center gap-4 mb-6">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${getAccentColorValue()}20` }}
                        >
                            <Palette className="w-5 h-5" style={{ color: getAccentColorValue() }} />
                        </div>
                        <div>
                            <p className="text-sm text-white font-medium">Choose Your Color</p>
                            <p className="text-xs text-[#5C6270]">This color appears throughout the app</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {accents.map((a) => (
                            <button
                                key={a.id}
                                onClick={() => updateAppearance({ accent: a.id })}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${accent === a.id
                                    ? `bg-white/5 ${a.glow}`
                                    : "hover:bg-white/5"
                                    }`}
                            >
                                <div
                                    className={`w-12 h-12 rounded-full transition-transform ${accent === a.id ? "scale-110 ring-4 ring-white/20" : ""
                                        }`}
                                    style={{ backgroundColor: a.color }}
                                />
                                <span className={`text-xs font-medium ${accent === a.id ? "text-white" : "text-[#5C6270]"
                                    }`}>
                                    {a.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Motion Level */}
            <section className="space-y-6">
                <h2 className="text-xs font-bold text-[#5C6270] uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">
                    Motion Level
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={() => updateAppearance({ motion: "full" })}
                        className={`relative bg-[#0F1117] rounded-xl border-2 p-5 transition-all text-left ${motion === "full"
                            ? "border-[#2DE2A6]"
                            : "border-[#2A2F3A] hover:border-[#3A3F4A]"
                            }`}
                        style={{
                            borderColor: motion === "full" ? getAccentColorValue() : undefined
                        }}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${motion === "full" ? "bg-[#2DE2A6]/10" : "bg-[#1E232F]"
                                }`}
                                style={{
                                    backgroundColor: motion === "full" ? `${getAccentColorValue()}20` : undefined
                                }}
                            >
                                <Sparkles className={`w-5 h-5 ${motion === "full" ? "animate-pulse" : "text-[#5C6270]"
                                    }`}
                                    style={{ color: motion === "full" ? getAccentColorValue() : undefined }}
                                />
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">Full Motion</p>
                                <p className="text-xs text-[#5C6270]">All animations and transitions enabled</p>
                            </div>
                        </div>
                        {motion === "full" && (
                            <div
                                className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: getAccentColorValue() }}
                            >
                                <Check className="w-3 h-3 text-[#0F1117]" />
                            </div>
                        )}
                    </button>

                    <button
                        onClick={() => updateAppearance({ motion: "reduced" })}
                        className={`relative bg-[#0F1117] rounded-xl border-2 p-5 transition-all text-left ${motion === "reduced"
                            ? "border-[#2DE2A6]"
                            : "border-[#2A2F3A] hover:border-[#3A3F4A]"
                            }`}
                        style={{
                            borderColor: motion === "reduced" ? getAccentColorValue() : undefined
                        }}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${motion === "reduced" ? "bg-[#2DE2A6]/10" : "bg-[#1E232F]"
                                }`}
                                style={{
                                    backgroundColor: motion === "reduced" ? `${getAccentColorValue()}20` : undefined
                                }}
                            >
                                <Zap className={`w-5 h-5 ${motion === "reduced" ? "" : "text-[#5C6270]"
                                    }`}
                                    style={{ color: motion === "reduced" ? getAccentColorValue() : undefined }}
                                />
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">Reduced Motion</p>
                                <p className="text-xs text-[#5C6270]">Minimizes animations for accessibility</p>
                            </div>
                        </div>
                        {motion === "reduced" && (
                            <div
                                className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: getAccentColorValue() }}
                            >
                                <Check className="w-3 h-3 text-[#0F1117]" />
                            </div>
                        )}
                    </button>
                </div>
            </section>

            {/* Font Scale */}
            <section className="space-y-6">
                <h2 className="text-xs font-bold text-[#5C6270] uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">
                    Font Scale
                </h2>

                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-[#4F8CFF]/10 flex items-center justify-center">
                            <Type className="w-5 h-5 text-[#4F8CFF]" />
                        </div>
                        <div>
                            <p className="text-sm text-white font-medium">Text Size</p>
                            <p className="text-xs text-[#5C6270]">Adjust the size of text throughout the app</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-[#171B22] rounded-xl">
                        <button
                            onClick={() => updateAppearance({ textScale: "small" })}
                            className={`flex-1 py-3 rounded-lg text-center transition-all ${textScale === "small"
                                ? "bg-white/10 text-white"
                                : "text-[#5C6270] hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <span className="text-xs font-medium">Aa</span>
                            <p className="text-[10px] mt-1 opacity-70">Small</p>
                        </button>
                        <button
                            onClick={() => updateAppearance({ textScale: "normal" })}
                            className={`flex-1 py-3 rounded-lg text-center transition-all ${textScale === "normal"
                                ? "bg-white/10 text-white"
                                : "text-[#5C6270] hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <span className="text-sm font-medium">Aa</span>
                            <p className="text-[10px] mt-1 opacity-70">Normal</p>
                        </button>
                        <button
                            onClick={() => updateAppearance({ textScale: "large" })}
                            className={`flex-1 py-3 rounded-lg text-center transition-all ${textScale === "large"
                                ? "bg-white/10 text-white"
                                : "text-[#5C6270] hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <span className="text-base font-medium">Aa</span>
                            <p className="text-[10px] mt-1 opacity-70">Large</p>
                        </button>
                    </div>

                    {/* Live Preview Text */}
                    <div className="mt-4 p-4 bg-[#171B22] rounded-xl">
                        <p
                            className={`text-white transition-all`}
                            style={{
                                fontSize: textScale === "small" ? "0.875rem" : textScale === "large" ? "1.125rem" : "1rem"
                            }}
                        >
                            This is how text will appear throughout the app with your current settings.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
