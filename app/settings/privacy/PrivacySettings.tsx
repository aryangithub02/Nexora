"use client";

import { useState, useEffect } from "react";
import {
    Eye,
    EyeOff,
    Users,
    UserPlus,
    MessageCircle,
    AtSign,
    Compass,
    Sparkles,
    Ban,
    X,
    Search
} from "lucide-react";

interface BlockedUser {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
}

export default function PrivacySettings() {
    // Visibility states
    const [isPublic, setIsPublic] = useState(true);
    const [requireFollowApproval, setRequireFollowApproval] = useState(false);

    // Interaction controls
    const [whoCanComment, setWhoCanComment] = useState<"everyone" | "followers" | "none">("everyone");
    const [whoCanMention, setWhoCanMention] = useState<"everyone" | "followers">("everyone");

    // Discovery settings
    const [appearInDiscover, setAppearInDiscover] = useState(true);
    const [allowSuggestions, setAllowSuggestions] = useState(true);

    // Blocked users
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([
        { id: "1", username: "spammer123", displayName: "Spammer" },
        { id: "2", username: "troll_account", displayName: "Troll" },
    ]);
    const [searchBlockedQuery, setSearchBlockedQuery] = useState("");

    // Generate visibility summary
    const getVisibilitySummary = () => {
        const parts: string[] = [];

        if (isPublic) {
            parts.push("Anyone can see your profile");
        } else {
            parts.push("Only approved followers can see your content");
        }

        if (whoCanComment === "none") {
            parts.push("Comments are disabled");
        } else if (whoCanComment === "followers") {
            parts.push("Only followers can comment");
        }

        if (!appearInDiscover) {
            parts.push("Hidden from Discover");
        }

        return parts.join(" · ");
    };

    const handleUnblock = (userId: string) => {
        setBlockedUsers(prev => prev.filter(u => u.id !== userId));
    };

    const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
        <button
            onClick={onChange}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${enabled ? "bg-[#2DE2A6]" : "bg-[#2A2F3A]"
                }`}
        >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-md ${enabled ? "left-7" : "left-1"
                }`} />
        </button>
    );

    const RadioOption = ({
        label,
        selected,
        onClick,
        description
    }: {
        label: string;
        selected: boolean;
        onClick: () => void;
        description?: string;
    }) => (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all w-full text-left ${selected
                    ? "border-[#2DE2A6]/50 bg-[#2DE2A6]/5"
                    : "border-[#2A2F3A] hover:border-[#3A3F4A]"
                }`}
        >
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selected ? "border-[#2DE2A6]" : "border-[#5C6270]"
                }`}>
                {selected && <div className="w-2 h-2 rounded-full bg-[#2DE2A6]" />}
            </div>
            <div>
                <p className={`text-sm font-medium ${selected ? "text-white" : "text-[#9AA0AA]"}`}>
                    {label}
                </p>
                {description && (
                    <p className="text-xs text-[#5C6270]">{description}</p>
                )}
            </div>
        </button>
    );

    return (
        <div className="space-y-12 relative z-10">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
                    Privacy
                </h1>
                <p className="text-sm text-[#5C6270] mt-1 font-[family-name:var(--font-inter)]">
                    Control how others can interact with you
                </p>
            </div>

            {/* Visibility Summary Banner */}
            <div className="bg-gradient-to-r from-[#4F8CFF]/10 to-[#2DE2A6]/10 rounded-xl border border-white/5 p-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#4F8CFF]/20 flex items-center justify-center">
                        {isPublic ? <Eye className="w-4 h-4 text-[#4F8CFF]" /> : <EyeOff className="w-4 h-4 text-[#4F8CFF]" />}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[#4F8CFF] uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">
                            Who can see you now
                        </p>
                        <p className="text-sm text-white/80 font-[family-name:var(--font-inter)]">
                            {getVisibilitySummary()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Account Visibility Section */}
            <section className="space-y-6">
                <h2 className="text-xs font-bold text-[#5C6270] uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">
                    Account Visibility
                </h2>

                {/* Public/Private Toggle */}
                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPublic ? "bg-[#2DE2A6]/10" : "bg-[#FF6B6B]/10"
                                }`}>
                                {isPublic ? (
                                    <Eye className="w-5 h-5 text-[#2DE2A6]" />
                                ) : (
                                    <EyeOff className="w-5 h-5 text-[#FF6B6B]" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">
                                    {isPublic ? "Public Account" : "Private Account"}
                                </p>
                                <p className="text-xs text-[#5C6270]">
                                    {isPublic
                                        ? "Anyone can see your content and follow you"
                                        : "Only approved followers can see your content"
                                    }
                                </p>
                            </div>
                        </div>
                        <ToggleSwitch enabled={isPublic} onChange={() => setIsPublic(!isPublic)} />
                    </div>
                </div>

                {/* Follow Permissions */}
                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#4F8CFF]/10 flex items-center justify-center">
                                <UserPlus className="w-5 h-5 text-[#4F8CFF]" />
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">Require Follow Approval</p>
                                <p className="text-xs text-[#5C6270]">
                                    Review and approve follow requests manually
                                </p>
                            </div>
                        </div>
                        <ToggleSwitch
                            enabled={requireFollowApproval}
                            onChange={() => setRequireFollowApproval(!requireFollowApproval)}
                        />
                    </div>
                </div>
            </section>

            {/* Interaction Controls */}
            <section className="space-y-6">
                <h2 className="text-xs font-bold text-[#5C6270] uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">
                    Interaction Controls
                </h2>

                {/* Who Can Comment */}
                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#4F8CFF]/10 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-[#4F8CFF]" />
                        </div>
                        <div>
                            <p className="text-sm text-white font-medium">Who Can Comment</p>
                            <p className="text-xs text-[#5C6270]">Control who can comment on your reels</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                        <RadioOption
                            label="Everyone"
                            selected={whoCanComment === "everyone"}
                            onClick={() => setWhoCanComment("everyone")}
                        />
                        <RadioOption
                            label="Followers"
                            selected={whoCanComment === "followers"}
                            onClick={() => setWhoCanComment("followers")}
                        />
                        <RadioOption
                            label="No One"
                            selected={whoCanComment === "none"}
                            onClick={() => setWhoCanComment("none")}
                        />
                    </div>
                </div>

                {/* Who Can Mention */}
                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#F4D03F]/10 flex items-center justify-center">
                            <AtSign className="w-5 h-5 text-[#F4D03F]" />
                        </div>
                        <div>
                            <p className="text-sm text-white font-medium">Who Can Mention You</p>
                            <p className="text-xs text-[#5C6270]">Control who can @mention you in comments</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        <RadioOption
                            label="Everyone"
                            selected={whoCanMention === "everyone"}
                            onClick={() => setWhoCanMention("everyone")}
                        />
                        <RadioOption
                            label="Followers Only"
                            selected={whoCanMention === "followers"}
                            onClick={() => setWhoCanMention("followers")}
                        />
                    </div>
                </div>
            </section>

            {/* Discovery Settings */}
            <section className="space-y-6">
                <h2 className="text-xs font-bold text-[#5C6270] uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">
                    Discovery Settings
                </h2>

                {/* Appear in Discover */}
                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#2DE2A6]/10 flex items-center justify-center">
                                <Compass className="w-5 h-5 text-[#2DE2A6]" />
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">Appear in Discover</p>
                                <p className="text-xs text-[#5C6270]">
                                    Let others find you in the Discover section
                                </p>
                            </div>
                        </div>
                        <ToggleSwitch enabled={appearInDiscover} onChange={() => setAppearInDiscover(!appearInDiscover)} />
                    </div>
                </div>

                {/* Profile Suggestions */}
                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#4F8CFF]/10 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-[#4F8CFF]" />
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">Allow Profile Suggestions</p>
                                <p className="text-xs text-[#5C6270]">
                                    Suggest your profile to others who may like your content
                                </p>
                            </div>
                        </div>
                        <ToggleSwitch enabled={allowSuggestions} onChange={() => setAllowSuggestions(!allowSuggestions)} />
                    </div>
                </div>
            </section>

            {/* Blocked Users */}
            <section className="space-y-6">
                <h2 className="text-xs font-bold text-[#5C6270] uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">
                    Blocked Users
                </h2>

                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] overflow-hidden">
                    {/* Search */}
                    <div className="p-4 border-b border-[#2A2F3A]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C6270]" />
                            <input
                                type="text"
                                placeholder="Search blocked users..."
                                value={searchBlockedQuery}
                                onChange={(e) => setSearchBlockedQuery(e.target.value)}
                                className="w-full bg-[#171B22] border border-[#2A2F3A] rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-[#4F8CFF] transition-colors"
                            />
                        </div>
                    </div>

                    {/* Blocked List */}
                    {blockedUsers.length === 0 ? (
                        <div className="p-8 text-center">
                            <Ban className="w-8 h-8 text-[#5C6270] mx-auto mb-3" />
                            <p className="text-sm text-[#5C6270]">You haven't blocked anyone</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#2A2F3A]">
                            {blockedUsers
                                .filter(u =>
                                    u.username.toLowerCase().includes(searchBlockedQuery.toLowerCase()) ||
                                    u.displayName.toLowerCase().includes(searchBlockedQuery.toLowerCase())
                                )
                                .map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-4 hover:bg-[#1E232F] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#2A2F3A] flex items-center justify-center text-sm text-white font-medium">
                                                {user.displayName[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm text-white font-medium">{user.displayName}</p>
                                                <p className="text-xs text-[#5C6270]">@{user.username}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleUnblock(user.id)}
                                            className="px-3 py-1.5 text-xs text-[#FF6B6B] border border-[#FF6B6B]/30 rounded-lg hover:bg-[#FF6B6B]/10 transition-colors"
                                        >
                                            Unblock
                                        </button>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
