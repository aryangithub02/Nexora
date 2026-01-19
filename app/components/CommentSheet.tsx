"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { X, Send, Loader2, Heart, CornerDownRight, MoreHorizontal, Trash2, Undo2, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";

interface CommentUser {
    _id: string;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
}

interface Comment {
    _id: string;
    isDeleted?: boolean;
    deletedBy?: string;
    text: string;
    createdAt: string;
    user?: CommentUser;
    isNew?: boolean;
    parentId?: string;
    likes?: string[];
    likeCount?: number;
    isLiked?: boolean;
    children?: Comment[]; // For threaded view
}

interface CommentSheetProps {
    videoId: string;
    videoOwnerId?: string;
    isOpen: boolean;
    onClose: () => void;
    commentPermission?: 'everyone' | 'followers' | 'no_one';
    isFollowing?: boolean;
}

export default function CommentSheet({ videoId, videoOwnerId, isOpen, onClose, commentPermission = 'everyone', isFollowing = false }: CommentSheetProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [inputFocused, setInputFocused] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
    const [undoMap, setUndoMap] = useState<Record<string, number>>({}); // commentId -> expiryTime
    const [expandedHidden, setExpandedHidden] = useState<Set<string>>(new Set());
    const { data: session } = useSession();
    const currentUserId = (session?.user as any)?.id;
    const isVideoOwner = currentUserId === videoOwnerId;

    const inputRef = useRef<HTMLInputElement>(null);
    const commentsContainerRef = useRef<HTMLDivElement>(null);

    // Thread comments
    const threads = useMemo(() => {
        const map = new Map<string, Comment>();
        const roots: Comment[] = [];

        // Clone and map
        comments.forEach(c => {
            map.set(c._id, { ...c, children: [] });
        });

        // Build tree
        comments.forEach(c => {
            const node = map.get(c._id)!;
            if (c.parentId && map.has(c.parentId)) {
                map.get(c.parentId)!.children!.push(node);
            } else {
                roots.push(node);
            }
        });

        // Sort: newest roots first, oldest replies first (chronological conversation)
        // Actually, if I want replies to be chronological:
        map.forEach(node => {
            node.children?.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });

        // Roots: newest first (default from API usually)
        return roots;
    }, [comments]);

    // Fetch comments when sheet opens
    useEffect(() => {
        if (isOpen && videoId) {
            fetchComments();
        }
    }, [isOpen, videoId]);

    const fetchComments = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/comments?videoId=${videoId}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments || []);
                setTotalCount(data.totalCount || 0);
            }
        } catch (error) {
            console.error("Failed to fetch comments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSending) return;

        setIsSending(true);

        // Optimistic update - add comment immediately at top
        const tempId = `temp-${Date.now()}`;
        const optimisticComment: Comment = {
            _id: tempId,
            text: newComment.trim(),
            createdAt: new Date().toISOString(),
            isNew: true, // Triggers shimmer animation
        };

        setComments(prev => [optimisticComment, ...prev]);
        setTotalCount(prev => prev + 1);
        setNewComment("");

        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    videoId,
                    text: optimisticComment.text,
                    parentId: replyingTo?.id
                }),
            });

            if (res.ok) {
                const data = await res.json();
                // Replace optimistic comment with real one
                setComments(prev =>
                    prev.map(c => c._id === tempId ? { ...data.comment, isNew: true } : c)
                );
                setTotalCount(data.totalCount);
            } else {
                // Revert on error
                setComments(prev => prev.filter(c => c._id !== tempId));
                setTotalCount(prev => prev - 1);
            }
        } catch (error) {
            console.error("Failed to post comment:", error);
            // Revert on error
            setComments(prev => prev.filter(c => c._id !== tempId));
            setTotalCount(prev => prev - 1);
        } finally {
            setIsSending(false);
            setReplyingTo(null);
        }
    };

    const handleLike = async (commentId: string, currentIsLiked: boolean) => {
        // Optimistic
        setComments(prev => prev.map(c => {
            if (c._id === commentId) {
                return {
                    ...c,
                    isLiked: !currentIsLiked,
                    likeCount: (c.likeCount || 0) + (currentIsLiked ? -1 : 1)
                };
            }
            return c;
        }));

        try {
            await fetch("/api/comments/like", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ commentId }),
            });
        } catch (error) {
            console.error("Failed to toggle like:", error);
            // Revert omitted for brevity
        }
    };



    const handleDeleteInitiate = (commentId: string, isOwnComment: boolean) => {
        if (isOwnComment) {
            // Start 5s timer
            const expiry = Date.now() + 5000;
            setUndoMap(prev => ({ ...prev, [commentId]: expiry }));

            // Auto-commit after 5s
            setTimeout(() => {
                setUndoMap(prev => {
                    if (prev[commentId] === expiry) {
                        // Still active, commit delete
                        commitDelete(commentId);
                        const { [commentId]: _, ...rest } = prev;
                        return rest;
                    }
                    return prev;
                });
            }, 5000);
        } else {
            // Creator deleting others - immediate
            commitDelete(commentId);
        }
    };

    const handleUndo = (commentId: string) => {
        setUndoMap(prev => {
            const { [commentId]: _, ...rest } = prev;
            return rest;
        });
    };

    const commitDelete = async (commentId: string) => {
        // Optimistic hide/update
        setComments(prev => prev.map(c =>
            c._id === commentId ? { ...c, isDeleted: true, text: "[deleted]" } : c
        ));
        setTotalCount(prev => Math.max(0, prev - 1));

        // Call API
        try {
            await fetch("/api/comments", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ commentId }),
            });
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const handleReply = (commentId: string, username: string) => {
        setReplyingTo({ id: commentId, username });
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 300);
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return "Just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    const getUserInitial = (user?: CommentUser) => {
        if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
        if (user?.username) return user.username.charAt(0).toUpperCase();
        return "U";
    };

    // Recursive Comment Item
    const CommentItem = ({ comment, videoOwnerId, onReply, onLike, isReply = false }: { comment: Comment, videoOwnerId?: string, onReply: any, onLike: any, isReply?: boolean }) => {
        const isCreator = videoOwnerId && comment.user?._id === videoOwnerId;
        const isOwnComment = currentUserId && comment.user?._id === currentUserId;
        const canDelete = isOwnComment || isVideoOwner;
        const isUndoable = !!undoMap[comment._id];

        // Handle undo state
        if (isUndoable) {
            return (
                <div className={`mb-4 ${isReply ? 'ml-10' : ''}`}>
                    <div className="h-12 flex items-center justify-between px-4 bg-[#1E232F] border border-white/5 rounded-xl">
                        <span className="text-white/50 text-xs font-medium font-[family-name:var(--font-jetbrains-mono)]">
                            Comment deleted · <button onClick={() => handleUndo(comment._id)} className="text-[#4F8CFF] hover:underline ml-1">Undo (5s)</button>
                        </span>
                        <div className="w-4 h-4 rounded-full border-2 border-white/10 border-t-[#4F8CFF] animate-spin" />
                    </div>
                </div>
            );
        }

        // Handle deleted state
        if (comment.isDeleted) {
            return (
                <div className={`mb-4 ${isReply ? 'ml-10' : ''} opacity-50`}>
                    <div className="text-white/30 text-xs italic p-2 border-l-2 border-white/10 pl-3">
                        [Comment deleted]
                    </div>
                    {comment.children && (
                        <div className="mt-2 flex flex-col">
                            {comment.children.map(child => <CommentItem key={child._id} comment={child} videoOwnerId={videoOwnerId} onReply={onReply} onLike={onLike} isReply={true} />)}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className={`flex flex-col ${isReply ? 'mt-4 ml-10' : ''}`}>
                <div
                    className={`flex gap-3 ${comment.isNew ? 'animate-mint-shimmer' : ''}`}
                >
                    {/* Avatar */}
                    <div className="flex-shrink-0 relative">
                        {comment.user?.avatarUrl ? (
                            <img
                                src={comment.user.avatarUrl}
                                alt={comment.user.displayName || "User"}
                                className={`rounded-full object-cover ${isReply ? 'w-7 h-7' : 'w-9 h-9'} ${isCreator ? 'ring-2 ring-[#FF6B6B]' : ''}`}
                            />
                        ) : (
                            <div
                                className={`${isReply ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'} rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#2DE2A6] flex items-center justify-center text-white font-semibold`}
                                style={{ fontFamily: "var(--font-space-grotesk)" }}
                            >
                                {getUserInitial(comment.user)}
                            </div>
                        )}

                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span
                                className={`text-white font-medium ${isReply ? 'text-xs' : 'text-sm'}`}
                                style={{ fontFamily: "var(--font-space-grotesk)" }}
                            >
                                {comment.user?.displayName || comment.user?.username || "User"}
                            </span>
                            {isCreator && (
                                <span className="text-[#FF6B6B] text-[10px] font-bold px-1.5 py-0.5 bg-[#FF6B6B]/10 rounded-full">
                                    Author
                                </span>
                            )}
                            <span className="text-white/30 text-[10px]">
                                {formatTimeAgo(comment.createdAt)}
                            </span>
                        </div>
                        <p
                            className={`text-white/80 ${isReply ? 'text-xs' : 'text-sm'} mt-0.5 break-words ${isCreator ? 'text-[#FFD700]/90 font-medium' : ''}`}
                            style={{ fontFamily: "var(--font-inter)" }}
                        >
                            {comment.text}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-4 mt-2">
                            <button
                                onClick={() => onReply(comment._id, comment.user?.username || "User")}
                                className="text-white/40 text-xs font-medium hover:text-white transition-colors flex items-center gap-1"
                            >
                                Reply
                            </button>

                            <button
                                onClick={() => onLike(comment._id, !!comment.isLiked)}
                                className={`text-xs font-medium flex items-center gap-1 transition-colors ${comment.isLiked ? 'text-[#FF6B6B]' : 'text-white/40 hover:text-white'}`}
                            >
                                <Heart size={12} className={comment.isLiked ? 'fill-current' : ''} />
                                {comment.likeCount || 0}
                            </button>

                            {canDelete && (
                                <button
                                    onClick={() => handleDeleteInitiate(comment._id, !!isOwnComment)}
                                    className="text-white/40 text-xs font-medium hover:text-red-400 transition-colors flex items-center gap-1"
                                >
                                    <Trash2 size={12} />
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recursive Children */}
                {comment.children && comment.children.length > 0 && (
                    <div className="flex flex-col">
                        {comment.children.map(child => (
                            <CommentItem
                                key={child._id}
                                comment={child}
                                videoOwnerId={videoOwnerId}
                                onReply={onReply}
                                onLike={onLike}
                                isReply={true}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen && !isClosing) return null;

    return (
        <>
            {/* Backdrop - Dimmed and blurred */}
            <div
                className={`fixed inset-0 z-[100] ${isClosing ? 'animate-backdrop-fade-out' : 'animate-backdrop-fade'}`}
                style={{
                    background: "rgba(0, 0, 0, 0.6)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                }}
                onClick={handleClose}
            />

            {/* Half-height Sheet - Centered on desktop */}
            <div
                className={`fixed z-[101] ${isClosing ? 'animate-sheet-down' : 'animate-sheet-up'} bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:max-w-[480px]`}
                style={{
                    height: "55vh",
                    maxHeight: "500px",
                    background: "linear-gradient(180deg, rgba(23, 27, 34, 0.98) 0%, rgba(15, 17, 23, 0.99) 100%)",
                    borderTopLeftRadius: "24px",
                    borderTopRightRadius: "24px",
                    boxShadow: "0 -8px 40px rgba(0, 0, 0, 0.5)",
                }}
            >
                {/* Handle Bar */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1 rounded-full bg-white/20" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                    <h3
                        className="text-white font-semibold text-lg"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                        Comments
                        <span className="ml-2 text-sm font-normal text-white/50">
                            {totalCount.toLocaleString()}
                        </span>
                    </h3>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5 text-white/70" />
                    </button>
                </div>

                {/* Comments List */}
                <div
                    ref={commentsContainerRef}
                    className="flex-1 overflow-y-auto px-5 py-4 scrollbar-hide"
                    style={{ height: "calc(55vh - 140px)" }}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 text-[#4F8CFF] animate-spin" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-white/40">
                            <p className="text-sm" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                                No comments yet
                            </p>
                            <p className="text-xs mt-1">Be the first to comment</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {threads.map((comment, index) => (
                                <CommentItem
                                    key={comment._id}
                                    comment={comment}
                                    videoOwnerId={videoOwnerId}
                                    onReply={handleReply}
                                    onLike={handleLike}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div
                    className="absolute bottom-0 left-0 right-0 px-5 py-4 border-t border-white/5"
                    style={{
                        background: "linear-gradient(180deg, rgba(23, 27, 34, 0.9) 0%, rgba(15, 17, 23, 1) 100%)",
                    }}
                >
                    {/* Permission Check */}
                    {(() => {
                        const canComment =
                            isVideoOwner ||
                            commentPermission === 'everyone' ||
                            (commentPermission === 'followers' && isFollowing);

                        if (!canComment) {
                            return (
                                <div className="flex items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10">
                                    <AlertCircle className="w-4 h-4 text-[#FF6B6B] mr-2" />
                                    <span className="text-white/60 text-xs font-medium">
                                        {commentPermission === 'no_one'
                                            ? "Comments are disabled for this post."
                                            : "Only followers can comment."}
                                    </span>
                                </div>
                            );
                        }

                        return (
                            <>
                                {/* Reply Pill - Connector Line */}
                                {replyingTo && (
                                    <div className="absolute -top-8 left-10 flex items-center animate-slide-up">
                                        <div className="w-px h-8 bg-white/20 mr-3" />
                                        <div className="flex items-center gap-2 bg-[#1E232F] border border-white/10 px-3 py-1.5 rounded-full shadow-lg">
                                            <span className="text-white/60 text-xs">Replying to</span>
                                            <span className="text-[#2DE2A6] text-xs font-bold">@{replyingTo.username}</span>
                                            <button
                                                onClick={() => setReplyingTo(null)}
                                                className="ml-2 hover:bg-white/10 rounded-full p-0.5"
                                            >
                                                <X size={12} className="text-white/50" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="flex items-center gap-3 relative z-10 bg-[#0F1117] pt-2">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onFocus={() => setInputFocused(true)}
                                        onBlur={() => setInputFocused(false)}
                                        placeholder={replyingTo ? `Replying to @${replyingTo.username}...` : "Add a comment..."}
                                        maxLength={1000}
                                        className={`flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-white text-sm placeholder-white/30 focus:outline-none transition-all ${inputFocused ? 'animate-input-glow border-[#2DE2A6]/50' : ''
                                            }`}
                                        style={{ fontFamily: "var(--font-inter)" }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim() || isSending}
                                        className="p-3 rounded-full bg-gradient-to-r from-[#4F8CFF] to-[#2DE2A6] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                                        style={{
                                            boxShadow: newComment.trim() ? "0 4px 20px rgba(79, 140, 255, 0.4)" : "none",
                                        }}
                                    >
                                        {isSending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </button>
                                </form>
                            </>
                        );
                    })()}
                </div>
            </div>
        </>
    );
}
