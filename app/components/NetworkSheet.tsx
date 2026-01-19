"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { formatDistanceToNow } from "date-fns";

interface LiveUser {
    _id: string;
    displayName: string;
    username?: string;
    avatarUrl?: string;
    currentActivity: {
        type: 'watching' | 'uploading' | 'idle';
    };
    isActive: boolean;
}

interface CircleUser {
    _id: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
    lastActive?: string;
}

interface NetworkSheetProps {
    isOpen: boolean;
    onClose: () => void;
    liveUsers: LiveUser[];
    variant?: "drawer" | "sheet"; // Drawer = Desktop (Right), Sheet = Mobile (Bottom)
}

export default function NetworkSheet({ isOpen, onClose, liveUsers, variant = "drawer" }: NetworkSheetProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<"radar" | "circle" | "suggested">("radar");
    const [circleUsers, setCircleUsers] = useState<CircleUser[]>([]);
    const [loadingCircle, setLoadingCircle] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = "hidden";
        } else {
            setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = "unset";
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && activeTab === 'circle') {
            const fetchCircle = async () => {
                setLoadingCircle(true);
                try {
                    const res = await fetch('/api/network/circle');
                    if (res.ok) {
                        const data = await res.json();
                        setCircleUsers(data.circle || []);
                    }
                } catch (e) {
                    console.error("Failed to load circle", e);
                } finally {
                    setLoadingCircle(false);
                }
            };
            fetchCircle();
        }
    }, [isOpen, activeTab]);

    if (!isVisible && !isOpen) return null;

    const handleUserClick = (userId: string) => {
        onClose();
        router.push(`/profile/${userId}`);
    };

    // Responsive Classes
    const containerClasses = variant === "drawer"
        ? `absolute top-0 right-0 bottom-0 w-[85%] max-w-[320px] border-l border-white/10 ${isOpen ? "translate-x-0" : "translate-x-full"}`
        : `absolute bottom-0 left-0 right-0 h-[85vh] w-full rounded-t-[32px] border-t border-white/10 ${isOpen ? "translate-y-0" : "translate-y-full"}`;

    return (
        <div className={`fixed inset-0 z-[100] transition-all duration-300 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/40 backdrop-blur-[4px] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={`${containerClasses} bg-[#0F1117]/95 backdrop-blur-2xl shadow-[-8px_0_32px_rgba(0,0,0,0.5)] flex flex-col transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1)`}
            >
                {/* Drag Handle (Mobile Only) */}
                {variant === "sheet" && (
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-12 h-1.5 rounded-full bg-white/20" />
                    </div>
                )}

                {/* Header */}
                <div className="p-6 pb-2 shrink-0">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
                                Network
                            </h2>
                            <p className="text-xs text-[#5C6270] mt-1 font-[family-name:var(--font-jetbrains-mono)]">
                                Your social graph
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                        {(['radar', 'circle', 'suggested'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${activeTab === tab
                                    ? 'bg-[#2DE2A6]/10 text-[#2DE2A6] shadow-[0_0_10px_rgba(45,226,166,0.1)]'
                                    : 'text-[#5C6270] hover:text-white'
                                    }`}
                                style={{ fontFamily: 'var(--font-space-grotesk)' }}
                            >
                                {tab === 'radar' && 'Live Radar'}
                                {tab === 'circle' && 'Your Circle'}
                                {tab === 'suggested' && 'Requests'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {/* LIVE RADAR TAB */}
                    {activeTab === 'radar' && (
                        <>
                            {liveUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[50vh] text-center opacity-60">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 relative">
                                        <div className="absolute inset-0 rounded-full border border-white/5 animate-ping opacity-20" />
                                        <span className="text-2xl grayscale">📡</span>
                                    </div>
                                    <p className="text-white font-medium mb-1 font-[family-name:var(--font-inter)]">Your network is quiet</p>
                                    <p className="text-xs text-[#5C6270]">Discover new creators to wake it up.</p>
                                </div>
                            ) : (
                                liveUsers.map((user, index) => (
                                    <button
                                        key={user._id}
                                        onClick={() => handleUserClick(user._id)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] active:bg-white/[0.08] transition-all group animate-in slide-in-from-right-4 fade-in duration-300"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="relative">
                                            <div className={`w-10 h-10 rounded-full p-[1.5px] ${user.isActive ? "bg-gradient-to-br from-[#2DE2A6] to-[#4F8CFF] shadow-[0_0_8px_rgba(45,226,166,0.3)]" : "bg-white/10"}`}>
                                                <div className="w-full h-full rounded-full bg-[#1E232F] overflow-hidden flex items-center justify-center">
                                                    {user.avatarUrl ? (
                                                        <Image src={user.avatarUrl} alt={user.displayName} width={40} height={40} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-white/60 font-bold text-xs">{user.displayName[0]}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <h3 className="text-sm font-medium text-white font-[family-name:var(--font-inter)] truncate">
                                                {user.displayName}
                                            </h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <p className="text-[10px] text-[#2DE2A6] font-medium font-[family-name:var(--font-jetbrains-mono)]">
                                                    {user.currentActivity.type === 'watching' ? 'Watching' :
                                                        user.currentActivity.type === 'uploading' ? 'Uploading' : 'Idle'}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </>
                    )}

                    {/* CIRCLE TAB */}
                    {activeTab === 'circle' && (
                        <>
                            {loadingCircle ? (
                                <div className="flex flex-col items-center justify-center p-8 space-y-3">
                                    <div className="w-8 h-8 border-2 border-[#2DE2A6] border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs text-[#5C6270]">Loading your circle...</p>
                                </div>
                            ) : circleUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[50vh] text-center opacity-60">
                                    <h3 className="text-white font-medium mb-1">Your Circle is empty</h3>
                                    <p className="text-xs text-[#5C6270]">Follow people to see them here.</p>
                                </div>
                            ) : (
                                circleUsers.map((user, index) => (
                                    <button
                                        key={user._id}
                                        onClick={() => handleUserClick(user._id)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] active:bg-white/[0.08] transition-all group animate-in slide-in-from-right-4 fade-in duration-300"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-white/10 p-[1px]">
                                                <div className="w-full h-full rounded-full bg-[#1E232F] overflow-hidden flex items-center justify-center">
                                                    {user.avatarUrl ? (
                                                        <Image src={user.avatarUrl} alt={user.displayName} width={40} height={40} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-white/60 font-bold text-xs">{user.displayName[0]}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <h3 className="text-sm font-medium text-white font-[family-name:var(--font-inter)] truncate">
                                                {user.displayName}
                                            </h3>
                                            <p className="text-[10px] text-[#5C6270] truncate">@{user.username}</p>
                                        </div>
                                        <div className="text-[10px] text-[#5C6270] font-[family-name:var(--font-jetbrains-mono)] whitespace-nowrap">
                                            {user.lastActive
                                                ? formatDistanceToNow(new Date(user.lastActive), { addSuffix: true })
                                                : 'Recently'}
                                        </div>
                                    </button>
                                ))
                            )}
                        </>
                    )}

                    {/* SUGGESTED TAB (Placeholder for now) */}
                    {activeTab === 'suggested' && (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-center opacity-40">
                            <h3 className="text-white font-medium mb-1">Requests</h3>
                            <p className="text-xs text-[#5C6270]">No pending requests</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
