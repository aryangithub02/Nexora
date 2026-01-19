"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Check, X, User } from "lucide-react";
import Link from "next/link";
import LeftSpine from "@/app/components/LeftSpine";

interface FollowRequest {
    _id: string;
    requester: {
        _id: string;
        username: string;
        displayName: string;
        avatarUrl?: string;
    };
    createdAt: string;
}

// ... imports

export default function NotificationsPage() {
    const { data: session } = useSession();
    const [requests, setRequests] = useState<FollowRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [processedRequests, setProcessedRequests] = useState<Map<string, 'approved' | 'rejected'>>(new Map());

    useEffect(() => {
        if (session?.user) {
            fetchRequests();
        }
    }, [session]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/follow/requests", { cache: 'no-store' }); // Ensure client doesn't cache
            if (res.ok) {
                const data = await res.json();
                // Filter out already processed ones if we re-fetch (optional, but good for UX)
                const pending = data.requests.filter((r: FollowRequest) => !processedRequests.has(r._id));
                setRequests(pending);
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };
    // ... rest of code

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Auto-hide toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
        if (processing) return;
        setProcessing(requestId);

        try {
            const endpoint = action === 'approve'
                ? "/api/follow/requests/approve"
                : "/api/follow/requests/reject";

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId })
            });

            if (res.ok) {
                // Show Toast
                setToast({
                    message: action === 'approve' ? "Request Approved" : "Request Rejected",
                    type: 'success'
                });

                // Remove from list immediately
                setRequests(prev => prev.filter(req => req._id !== requestId));
            } else {
                console.error("Action failed", await res.text());
                setToast({ message: "Action failed", type: 'error' });
            }
        } catch (error) {
            console.error(`Failed to ${action} request`, error);
            setToast({ message: "Network error", type: 'error' });
        } finally {
            setProcessing(null);
        }
    };

    return (
        <main className="min-h-screen bg-[#0F1117] flex relative">
            <LeftSpine onAvatarClick={() => { }} />

            <div className="flex-1 ml-0 md:ml-20 p-6 md:p-12">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-8 font-[family-name:var(--font-space-grotesk)]">
                        Notifications
                    </h1>

                    <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
                        <div className="p-4 border-b border-white/5">
                            <h2 className="text-lg font-medium text-white">Follow Requests</h2>
                        </div>

                        {loading ? (
                            <div className="p-12 flex justify-center">
                                <Loader2 className="w-6 h-6 text-[#4F8CFF] animate-spin" />
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-[#5C6270]">No pending follow requests</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {requests.map((req) => (
                                    <div key={req._id} className="p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                                        <Link href={`/profile/${req.requester._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                                                {req.requester.avatarUrl ? (
                                                    <img
                                                        src={req.requester.avatarUrl}
                                                        alt={req.requester.username}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/50">
                                                        <User size={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="truncate">
                                                <p className="text-white font-medium truncate">{req.requester.displayName}</p>
                                                <p className="text-[#5C6270] text-sm truncate">@{req.requester.username}</p>
                                            </div>
                                        </Link>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleAction(req._id, 'approve');
                                                }}
                                                disabled={!!processing}
                                                className="p-2 rounded-full bg-[#4F8CFF]/10 text-[#4F8CFF] hover:bg-[#4F8CFF]/20 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Approve"
                                            >
                                                {processing === req._id ? (
                                                    <Loader2 size={18} className="animate-spin" />
                                                ) : (
                                                    <Check size={18} />
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleAction(req._id, 'reject');
                                                }}
                                                disabled={!!processing}
                                                className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Reject"
                                            >
                                                {processing === req._id ? (
                                                    <Loader2 size={18} className="animate-spin" />
                                                ) : (
                                                    <X size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className={`px-6 py-3 rounded-full backdrop-blur-md border shadow-2xl flex items-center gap-3 ${toast.type === 'success'
                            ? 'bg-[#0F1117]/90 border-[#2DE2A6]/20 text-white'
                            : 'bg-[#0F1117]/90 border-red-500/20 text-white'
                        }`}>
                        {toast.type === 'success' ? (
                            <Check size={18} className="text-[#2DE2A6]" />
                        ) : (
                            <X size={18} className="text-red-500" />
                        )}
                        <span className="font-medium text-sm">{toast.message}</span>
                    </div>
                </div>
            )}
        </main>
    );
}
