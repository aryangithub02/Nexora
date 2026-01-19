"use client";

import { useState, useEffect } from "react";
import { Link2, UserPlus, Share2, X, Check, Twitter, Facebook, MessageCircle } from "lucide-react";

interface ShareMenuProps {
    videoId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ShareMenu({ videoId, isOpen, onClose }: ShareMenuProps) {
    const [copied, setCopied] = useState(false);
    const [sent, setSent] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    useEffect(() => {
        if (sent) {
            const timer = setTimeout(() => {
                setSent(false);
                handleClose();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [sent]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 200);
    };

    const recordShare = async (shareType: 'copy_link' | 'send_user' | 'external', externalPlatform?: string) => {
        try {
            await fetch("/api/shares", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId, shareType, externalPlatform }),
            });
        } catch (error) {
            console.error("Failed to record share:", error);
        }
    };

    const handleCopyLink = async () => {
        const url = `${window.location.origin}/reel/${videoId}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            await recordShare('copy_link');
            setSent(true);
        } catch (error) {
            console.error("Failed to copy link:", error);
        }
    };

    const handleExternalShare = async (platform: string) => {
        const url = `${window.location.origin}/reel/${videoId}`;
        const text = "Check out this reel!";

        let shareUrl = "";
        switch (platform) {
            case "twitter":
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
                break;
            case "facebook":
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case "whatsapp":
                shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
                break;
        }

        if (shareUrl) {
            window.open(shareUrl, "_blank", "width=600,height=400");
            await recordShare('external', platform);
            setSent(true);
        }
    };

    const handleNativeShare = async () => {
        const url = `${window.location.origin}/reel/${videoId}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Check out this reel!",
                    url,
                });
                await recordShare('external', 'native');
                setSent(true);
            } catch (error) {
                // User cancelled, that's fine
                if ((error as Error).name !== "AbortError") {
                    console.error("Failed to share:", error);
                }
            }
        }
    };

    if (!isOpen && !isClosing) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-50 ${isClosing ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
                style={{
                    background: "rgba(0, 0, 0, 0.7)",
                    backdropFilter: "blur(4px)",
                    WebkitBackdropFilter: "blur(4px)",
                }}
                onClick={handleClose}
            />

            {/* Radial Menu */}
            <div
                className={`fixed z-50 ${isClosing ? 'opacity-0 scale-75' : 'animate-radial-expand'}`}
                style={{
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                }}
            >
                {/* Sent Badge */}
                {sent && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-sent-pulse">
                        <div
                            className="px-4 py-2 rounded-full bg-[#2DE2A6] text-white text-sm font-semibold flex items-center gap-2"
                            style={{ fontFamily: "var(--font-space-grotesk)" }}
                        >
                            <Check className="w-4 h-4" />
                            Sent
                        </div>
                    </div>
                )}

                {/* Central Close Button */}
                <div className="relative">
                    <button
                        onClick={handleClose}
                        className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors relative z-20"
                        style={{
                            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                        }}
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>

                    {/* Radial Options */}
                    {[
                        {
                            id: 'copy',
                            icon: copied ? <Check className="w-6 h-6 text-white" /> : <Link2 className="w-6 h-6 text-white" />,
                            label: copied ? "Copied!" : "Copy link",
                            action: handleCopyLink,
                            bgClass: copied ? 'bg-[#2DE2A6] shadow-[0_0_20px_rgba(45,226,166,0.5)]' : 'bg-white/10 backdrop-blur-md hover:bg-white/20',
                            key: 'copy'
                        },
                        {
                            id: 'twitter',
                            icon: <Twitter className="w-5 h-5 text-[#1DA1F2]" />,
                            label: "Twitter",
                            action: () => handleExternalShare("twitter"),
                            bgClass: 'bg-[#1DA1F2]/20 backdrop-blur-md hover:bg-[#1DA1F2]/40',
                            shadowColor: "rgba(29, 161, 242, 0.2)"
                        },
                        {
                            id: 'facebook',
                            icon: <Facebook className="w-5 h-5 text-[#1877F2]" />,
                            label: "Facebook",
                            action: () => handleExternalShare("facebook"),
                            bgClass: 'bg-[#1877F2]/20 backdrop-blur-md hover:bg-[#1877F2]/40',
                            shadowColor: "rgba(24, 119, 242, 0.2)"
                        },
                        {
                            id: 'whatsapp',
                            icon: <MessageCircle className="w-5 h-5 text-[#25D366]" />,
                            label: "WhatsApp",
                            action: () => handleExternalShare("whatsapp"),
                            bgClass: 'bg-[#25D366]/20 backdrop-blur-md hover:bg-[#25D366]/40',
                            shadowColor: "rgba(37, 211, 102, 0.2)"
                        },
                        {
                            id: 'more',
                            icon: <Share2 className="w-6 h-6 text-white" />,
                            label: "More",
                            action: handleNativeShare,
                            bgClass: 'bg-gradient-to-r from-[#4F8CFF] to-[#2DE2A6]',
                            shadowColor: "rgba(79, 140, 255, 0.4)",
                            condition: typeof navigator !== "undefined" && !!navigator.share
                        },
                        {
                            id: 'send',
                            icon: <UserPlus className="w-5 h-5 text-white" />,
                            label: "Send",
                            action: () => alert("Send to user feature coming soon!"),
                            bgClass: 'bg-white/10 backdrop-blur-md hover:bg-white/20 shadow-black/30'
                        }
                    ].filter(item => item.condition !== false).map((item, index, array) => {
                        // Calculate position on circle
                        const totalItems = array.length;
                        const angleStep = 360 / totalItems;
                        const startAngle = -90; // Start at top
                        const angle = startAngle + (index * angleStep);
                        const radius = 100; // px

                        const radian = (angle * Math.PI) / 180;
                        const x = Math.round(radius * Math.cos(radian));
                        const y = Math.round(radius * Math.sin(radian));

                        return (
                            <button
                                key={item.id}
                                onClick={item.action}
                                className="absolute flex flex-col items-center gap-2 group hover:z-10"
                                style={{
                                    top: "50%",
                                    left: "50%",
                                    transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                                }}
                            >
                                <div
                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${item.bgClass}`}
                                    style={{
                                        boxShadow: item.shadowColor ? `0 4px 20px ${item.shadowColor}` : undefined
                                    }}
                                >
                                    {item.icon}
                                </div>
                                <span
                                    className="text-white/70 text-[10px] font-medium whitespace-nowrap"
                                    style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                                >
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
