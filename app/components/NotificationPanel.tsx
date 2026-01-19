"use client";

import { useNotifications } from "@/app/context/NotificationContext";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Heart, MessageCircle, UserPlus, AtSign, UserCheck } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

// Helper to extract thumbnail from media URL (handles video files)
const getContextImageUrl = (url?: string) => {
    if (!url) return null;
    // If it's an ImageKit video URL, request the first frame as thumbnail
    if (url.includes("ik.imagekit.io") && /\.(mp4|mov|webm)($|\?)/i.test(url)) {
        const [path, query] = url.split('?');
        // Use ik-thumbnail.jpg endpoint + so-0 (start offset 0) to get the first frame
        return `${path}/ik-thumbnail.jpg?tr=w-160,h-240,c-maintain_ratio,so-0${query ? '&' + query : ''}`;
    }
    return url;
};

const NotificationItem = ({ note, onRead, onDismiss }: { note: any; onRead: (id: string) => void; onDismiss: (id: string) => void }) => {
    const itemRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (note.read) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        onRead(note._id);
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.8 } // 80% visible to count as read
        );

        if (itemRef.current) {
            observer.observe(itemRef.current);
        }

        return () => observer.disconnect();
    }, [note.read, note._id, onRead]);

    // Icons based on type
    const getIcon = () => {
        switch (note.type) {
            case "like": return <Heart size={14} className="fill-[#FF6B6B] text-[#FF6B6B]" />;
            case "comment": return <MessageCircle size={14} className="fill-[var(--accent)] text-[var(--accent)]" />;
            case "follow": return <UserPlus size={14} className="text-[var(--accent)]" />;
            case "follow_request": return <UserPlus size={14} className="text-[#FFD700]" />; // Gold for request
            case "follow_accepted": return <UserCheck size={14} className="text-[var(--accent)]" />;
            case "mention": return <AtSign size={14} className="text-[#F4D03F]" />;
            default: return null;
        }
    };

    const getLabel = () => {
        switch (note.type) {
            case "like": return "liked your reel";
            case "comment": return "commented on your reel";
            case "follow": return "followed you";
            case "follow_request": return "requested to follow you";
            case "follow_accepted": return "accepted your follow request";
            case "mention": return "mentioned you";
            default: return "interacted";
        }
    };

    // Dynamic Styles based on Signal Type
    const getAccentColor = () => {
        switch (note.type) {
            case "like": return "border-[#FF6B6B] shadow-[0_0_10px_rgba(255,107,107,0.2)]";
            case "comment": return "border-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]";
            case "mention": return "border-[#F4D03F] shadow-[0_0_10px_rgba(244,208,63,0.3)]";
            case "follow": return "border-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]";
            case "follow_request": return "border-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.3)]";
            case "follow_accepted": return "border-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]";
            default: return "border-white/10";
        }
    };

    const handleRequestAction = async (action: 'approve' | 'reject') => {
        if (!note.entityId) return;

        try {
            const endpoint = action === 'approve'
                ? "/api/follow/requests/approve"
                : "/api/follow/requests/reject";

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: note.entityId })
            });

            if (res.ok) {
                // User explicitly requested an alert
                window.alert(action === 'approve' ? "Request Approved" : "Request Rejected");
                onDismiss(note._id); // Remove notification immediately
            } else {
                const errorText = await res.text();
                console.error("Action failed", errorText);
                try {
                    const errorJson = JSON.parse(errorText);
                    window.alert(`Action failed: ${errorJson.error || errorText}`);
                } catch {
                    window.alert(`Action failed: ${errorText}`);
                }
            }
        } catch (error: any) {
            console.error("Action failed", error);
            window.alert(`Network/Client Error: ${error.message}`);
        }
    };

    const thumbUrl = getContextImageUrl(note.contextMediaUrl);

    return (
        <div
            ref={itemRef}
            className={`group relative flex items-start gap-4 p-4 pr-2 transition-all duration-500 border-b border-[var(--border-soft)] overflow-hidden ${note.read
                ? "bg-transparent opacity-60 hover:opacity-90"
                : "bg-[var(--accent)]/5 border-l-2 border-l-[var(--accent)]"
                } hover:bg-[var(--bg-hover)]`}
        >
            {/* Unread Mint Glow Effect */}
            {!note.read && (
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/5 to-transparent pointer-events-none" />
            )}

            {/* Avatar with Emotional Weight */}
            <div className="relative shrink-0 mt-1">
                <div className={`w-12 h-12 rounded-full p-[2px] transition-all duration-300 ${getAccentColor()}`}>
                    <div className="w-full h-full rounded-full overflow-hidden bg-[var(--bg-card)]">
                        {note.actor?.avatarUrl ? (
                            <Image src={note.actor.avatarUrl} alt="User" width={48} height={48} className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-secondary-text font-bold">
                                {note.actor?.username?.[0]?.toUpperCase() || "?"}
                            </div>
                        )}
                    </div>
                </div>

                {/* Micro-Badge */}
                <div className="absolute -bottom-1 -right-1 bg-[var(--bg-main)] p-1.5 rounded-full border border-[var(--border-soft)] shadow-md">
                    {getIcon()}
                </div>
            </div>

            {/* Story Fragment */}
            <div className="flex-1 min-w-0 flex flex-col justify-center z-10 pt-1">
                <p className="text-sm font-[family-name:var(--font-inter)] leading-snug text-[var(--text-muted)]">
                    <span className="font-bold text-[var(--text-main)] mr-1.5">
                        {note.actor?.username || "Private Account"}
                    </span>
                    <span className={`text-xs ${!note.read ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                        {getLabel()}
                    </span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[var(--text-muted)] font-[family-name:var(--font-jetbrains-mono)]">
                        {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                    </span>
                    {note.text && (
                        <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px] border-l border-[var(--border-soft)] pl-2 italic">
                            "{note.text}"
                        </span>
                    )}
                </div>

                {/* Action Buttons for Follow Requests */}
                {note.type === 'follow_request' && (
                    <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => handleRequestAction('approve')}
                            className="px-4 py-1.5 bg-[var(--accent)] text-[#0F1117] text-xs font-bold rounded-full hover:brightness-110 active:scale-95 transition-all"
                        >
                            Confirm
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRequestAction('reject')}
                            className="px-4 py-1.5 bg-[var(--bg-card)] border border-[var(--border-soft)] text-[var(--text-muted)] text-xs font-bold rounded-full hover:border-red-500/50 hover:text-red-400 active:scale-95 transition-all"
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>

            {/* Context Anchor - The Reel Thumbnail (Only if not request) */}
            {note.type !== 'follow_request' && (
                <div className="shrink-0 relative group/thumb pt-1">
                    {thumbUrl ? (
                        <div className="w-10 h-14 rounded-md overflow-hidden border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={thumbUrl}
                                alt="Reel Preview"
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            {/* Mint Overlay on Hover */}
                            <div className="absolute inset-0 bg-[var(--accent)]/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
                        </div>
                    ) : (
                        // Fallback/Spacer
                        <div className="w-10 h-14" />
                    )}
                </div>
            )}

            {/* Dismiss X Button - appears on hover */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(note._id);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-[var(--bg-main)]/80 border border-[var(--border-soft)] opacity-0 group-hover:opacity-100 hover:bg-[#FF6B6B]/20 hover:border-[#FF6B6B]/30 transition-all duration-200 z-20"
                aria-label="Dismiss notification"
            >
                <X size={12} className="text-white/60 hover:text-[#FF6B6B]" />
            </button>
        </div>
    );
};

export default function NotificationPanel() {
    const { isOpen, togglePanel, notifications, markAsRead, dismissNotification } = useNotifications();
    const handleRead = (id: string) => markAsRead([id]);
    const handleDismiss = (id: string) => dismissNotification(id);

    const unread = notifications.filter(n => !n.read);
    const read = notifications.filter(n => n.read);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop - Lighter & mistier */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[90] transition-opacity duration-300"
                onClick={togglePanel}
            />

            {/* Panel - Layered Glass */}
            <aside className="fixed right-0 top-0 h-screen w-full max-w-[400px] bg-[var(--bg-panel)]/80 backdrop-blur-2xl border-l border-[var(--border-soft)] z-[100] shadow-2xl animate-in slide-in-from-right duration-500 ease-out flex flex-col">
                {/* Header with Motion */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-soft)]">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--accent)" }} />
                        <h2 className="text-xl font-bold text-[var(--text-main)] font-[family-name:var(--font-space-grotesk)] tracking-tight">
                            Notifications
                        </h2>
                    </div>
                    <button
                        onClick={togglePanel}
                        className="group p-2 rounded-full hover:bg-white/5 transition-colors"
                    >
                        <X size={20} className="text-[#5C6270] group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Scroll Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {/* Unread Section */}
                    {unread.length > 0 && (
                        <div className="py-2">
                            <div className="px-5 py-3 text-xs font-bold text-[var(--accent)] uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">
                                New Notifications
                            </div>
                            {unread.map(note => {
                                const href = note.type === 'follow'
                                    ? `/profile/${note.actor?._id}`
                                    : (note.entityId ? `/?reelId=${note.entityId}` : '#');

                                if (note.type === "follow_request") {
                                    return (
                                        <div key={note._id} className="block w-full text-left">
                                            <NotificationItem note={note} onRead={handleRead} onDismiss={handleDismiss} />
                                        </div>
                                    );
                                }

                                return (
                                    <Link
                                        key={note._id}
                                        href={href}
                                        onClick={() => {
                                            handleRead(note._id);
                                            togglePanel();
                                        }}
                                        className="block w-full text-left"
                                    >
                                        <NotificationItem note={note} onRead={handleRead} onDismiss={handleDismiss} />
                                    </Link>
                                )
                            })}
                        </div>
                    )}

                    {/* Read Section */}
                    {read.length > 0 && (
                        <div className="py-2">
                            <div className="px-5 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">
                                Previously
                            </div>
                            {read.map(note => {
                                const href = note.type === 'follow'
                                    ? `/profile/${note.actor?._id}`
                                    : (note.entityId ? `/?reelId=${note.entityId}` : '#');

                                if (note.type === 'follow_request') {
                                    return (
                                        <div key={note._id} className="block w-full text-left">
                                            <NotificationItem note={note} onRead={handleRead} onDismiss={handleDismiss} />
                                        </div>
                                    );
                                }

                                return (
                                    <Link
                                        key={note._id}
                                        href={href}
                                        onClick={() => togglePanel()}
                                        className="block w-full text-left"
                                    >
                                        <NotificationItem note={note} onRead={handleRead} onDismiss={handleDismiss} />
                                    </Link>
                                )
                            })}
                        </div>
                    )}

                    {notifications.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]">
                            <p className="font-[family-name:var(--font-jetbrains-mono)] opacity-50">Zero notifications.</p>
                        </div>
                    )}

                    {/* Decay Safe Space */}
                    <div className="h-20" />
                </div>
            </aside>
        </>
    );
}
