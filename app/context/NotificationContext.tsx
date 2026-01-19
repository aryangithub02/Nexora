"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";


interface Notification {
    _id: string;
    recipient: string;
    actor: {
        _id: string;
        username?: string;
        avatarUrl?: string; // Optional if populated
        email?: string;
    };
    type: "like" | "comment" | "follow" | "mention" | "follow_request" | "follow_accept";
    entityId?: string;
    entityType?: "Reel" | "Comment" | "User";
    contextMediaUrl?: string; // Thumbnail for reels
    read: boolean;
    createdAt: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isOpen: boolean;
    togglePanel: () => void;
    markAsRead: (ids: string[]) => Promise<void>;
    dismissNotification: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [newNotificationToast, setNewNotificationToast] = useState(false);
    const lastNotificationIdRef = useRef<string | null>(null);

    const togglePanel = () => setIsOpen((prev) => !prev);

    // Toast Timer
    useEffect(() => {
        if (newNotificationToast) {
            const timer = setTimeout(() => setNewNotificationToast(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [newNotificationToast]);

    const fetchNotifications = useCallback(async () => {
        if (!session?.user) return;
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                const fetchedNotes = data.notifications || [];
                setNotifications(fetchedNotes);

                // Check for new notification
                if (fetchedNotes.length > 0) {
                    const latestId = fetchedNotes[0]._id;
                    if (lastNotificationIdRef.current && lastNotificationIdRef.current !== latestId) {
                        // We have a new notification!
                        setNewNotificationToast(true);
                        // Optional: Play a sound?
                    }
                    lastNotificationIdRef.current = latestId;
                } else {
                    lastNotificationIdRef.current = null;
                }
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    }, [session]);

    // ... (rest of functions: markAsRead, dismissNotification) ...

    const markAsRead = async (ids: string[]) => {
        if (ids.length === 0) return;

        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) => (ids.includes(n._id) ? { ...n, read: true } : n))
        );

        try {
            await fetch("/api/notifications/read", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationIds: ids }),
            });
            // Re-fetch to ensure sync? Not strictly necessary if optimistic works
        } catch (error) {
            console.error("Failed to mark notifications as read", error);
        }
    };

    const dismissNotification = async (id: string) => {
        // Optimistic update - remove from list
        setNotifications((prev) => prev.filter((n) => n._id !== id));

        try {
            await fetch("/api/notifications", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId: id }),
            });
        } catch (error) {
            console.error("Failed to dismiss notification", error);
            // Revert on error - refetch
            fetchNotifications();
        }
    };

    // Initial fetch & Polling
    useEffect(() => {
        if (session) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 15000);
            return () => clearInterval(interval);
        }
    }, [session, fetchNotifications]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                isOpen,
                togglePanel,
                markAsRead,
                dismissNotification,
                refresh: fetchNotifications,
            }}
        >
            {children}

            {/* Global Notification Toast */}
            {newNotificationToast && (
                <div
                    onClick={togglePanel}
                    className="fixed top-20 right-5 z-[200] cursor-pointer animate-in fade-in slide-in-from-right duration-300"
                >
                    <div className="bg-[#0F1117]/90 backdrop-blur-md border border-[var(--accent)] text-white px-6 py-4 rounded-xl shadow-[0_0_20px_rgba(45,226,166,0.3)] flex items-center gap-4 hover:bg-[#0F1117] transition-colors">
                        <div className="p-2 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                            <Bell size={20} className="animate-pulse" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">New Notification</p>
                            <p className="text-xs text-gray-400">You have unread updates</p>
                        </div>
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
