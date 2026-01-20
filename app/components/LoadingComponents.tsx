"use client";

import { motion } from "framer-motion";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    text?: string;
}

export default function LoadingSpinner({ size = "md", text }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "w-6 h-6",
        md: "w-10 h-10",
        lg: "w-16 h-16",
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <motion.div
                className={`${sizeClasses[size]} rounded-full border-2 border-white/10`}
                style={{ borderTopColor: "var(--accent, #4ef2b2)" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            {text && (
                <p className="text-sm text-gray-400 animate-pulse">{text}</p>
            )}
        </div>
    );
}

export function PageLoader({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-6">
                <motion.div
                    className="relative w-16 h-16"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className="absolute inset-0 rounded-full blur-xl opacity-50"
                        style={{ background: "linear-gradient(to right, var(--accent, #4ef2b2), var(--accent, #4ef2b2))" }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                        className="relative w-16 h-16 rounded-full border-2 border-white/20"
                        style={{ borderTopColor: "var(--accent, #4ef2b2)", borderRightColor: "var(--accent, #4ef2b2)" }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                </motion.div>

                <motion.p
                    className="text-gray-400 text-sm font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    {text}
                </motion.p>
            </div>
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-white/5 rounded-xl border border-white/10 p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/10 rounded w-1/3" />
                    <div className="h-2 bg-white/10 rounded w-1/4" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-2 bg-white/10 rounded w-full" />
                <div className="h-2 bg-white/10 rounded w-2/3" />
            </div>
        </div>
    );
}

export function ReelSkeleton() {
    return (
        <div className="relative w-full h-full bg-black rounded-xl overflow-hidden animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-white/10" />
            <div className="absolute bottom-4 left-4 right-20 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white/10" />
                    <div className="h-3 bg-white/10 rounded w-24" />
                </div>
                <div className="h-2 bg-white/10 rounded w-3/4" />
                <div className="h-2 bg-white/10 rounded w-1/2" />
            </div>
            <div className="absolute right-4 bottom-20 flex flex-col gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-white/10" />
                ))}
            </div>
        </div>
    );
}

export function SettingsSkeleton() {
    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6 animate-pulse">
            <div className="h-8 bg-white/10 rounded w-1/3 mb-8" />
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="h-4 bg-white/10 rounded w-32" />
                            <div className="h-3 bg-white/10 rounded w-48" />
                        </div>
                        <div className="w-12 h-6 bg-white/10 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="max-w-4xl mx-auto p-6 animate-pulse">
            <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 rounded-full bg-white/10" />
                <div className="flex-1 space-y-3">
                    <div className="h-6 bg-white/10 rounded w-1/4" />
                    <div className="h-4 bg-white/10 rounded w-1/3" />
                    <div className="flex gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-4 bg-white/10 rounded w-16" />
                        ))}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-1">
                {[...Array(9)].map((_, i) => (
                    <div key={i} className="aspect-square bg-white/10 rounded" />
                ))}
            </div>
        </div>
    );
}
