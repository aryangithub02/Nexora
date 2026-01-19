"use client";

import { useState } from "react";
import {
    Bell,
    Heart,
    MessageCircle,
    UserPlus,
    AtSign,
    Mail,
    Smartphone,
    Volume2,
    VolumeX,
    Moon
} from "lucide-react";

type NotificationType = "likes" | "comments" | "follows" | "mentions";

interface NotificationPreference {
    type: NotificationType;
    label: string;
    description: string;
    icon: React.ReactNode;
    iconColor: string;
    push: boolean;
    email: boolean;
}

export default function NotificationSettings() {
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);

    const [preferences, setPreferences] = useState<NotificationPreference[]>([
        {
            type: "likes",
            label: "Likes",
            description: "When someone likes your reel",
            icon: <Heart className="w-5 h-5" />,
            iconColor: "#FF6B6B",
            push: true,
            email: false
        },
        {
            type: "comments",
            label: "Comments",
            description: "When someone comments on your reel",
            icon: <MessageCircle className="w-5 h-5" />,
            iconColor: "#4F8CFF",
            push: true,
            email: true
        },
        {
            type: "follows",
            label: "New Followers",
            description: "When someone follows you",
            icon: <UserPlus className="w-5 h-5" />,
            iconColor: "#2DE2A6",
            push: true,
            email: true
        },
        {
            type: "mentions",
            label: "Mentions",
            description: "When someone mentions you",
            icon: <AtSign className="w-5 h-5" />,
            iconColor: "#F4D03F",
            push: true,
            email: false
        }
    ]);

    const togglePreference = (type: NotificationType, channel: "push" | "email") => {
        setPreferences(prev => prev.map(pref => {
            if (pref.type === type) {
                return { ...pref, [channel]: !pref[channel] };
            }
            return pref;
        }));
    };

    const ToggleSwitch = ({
        enabled,
        onChange,
        size = "normal"
    }: {
        enabled: boolean;
        onChange: () => void;
        size?: "small" | "normal";
    }) => (
        <button
            onClick={onChange}
            className={`relative rounded-full transition-all duration-300 ${enabled ? "bg-[#2DE2A6]" : "bg-[#2A2F3A]"
                } ${size === "small" ? "w-9 h-5" : "w-12 h-6"}`}
        >
            <div className={`absolute bg-white rounded-full transition-transform duration-300 shadow-md ${size === "small"
                ? `w-3 h-3 top-1 ${enabled ? "left-5" : "left-1"}`
                : `w-4 h-4 top-1 ${enabled ? "left-7" : "left-1"}`
                }`} />
        </button>
    );

    const allPushEnabled = preferences.every(p => p.push);
    const allEmailEnabled = preferences.every(p => p.email);

    const toggleAllPush = () => {
        const newValue = !allPushEnabled;
        setPreferences(prev => prev.map(p => ({ ...p, push: newValue })));
    };

    const toggleAllEmail = () => {
        const newValue = !allEmailEnabled;
        setPreferences(prev => prev.map(p => ({ ...p, email: newValue })));
    };

    return (
        <div className="space-y-12 relative z-10">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
                    Notifications
                </h1>
                <p className="text-sm text-[#5C6270] mt-1 font-[family-name:var(--font-inter)]">
                    Choose how you want to be notified
                </p>
            </div>

            {/* Master Controls */}
            <section className="space-y-4">
                <h2 className="text-xs font-bold text-[#5C6270] uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">
                    Notification Channels
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Push Notifications */}
                    <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pushEnabled ? "bg-[#2DE2A6]/10" : "bg-[#1E232F]"
                                    }`}>
                                    <Smartphone className={`w-5 h-5 ${pushEnabled ? "text-[#2DE2A6]" : "text-[#5C6270]"}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-white font-medium">Push Notifications</p>
                                    <p className="text-xs text-[#5C6270]">Get notified on your device</p>
                                </div>
                            </div>
                            <ToggleSwitch enabled={pushEnabled} onChange={() => setPushEnabled(!pushEnabled)} />
                        </div>
                    </div>

                    {/* Email Notifications */}
                    <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${emailEnabled ? "bg-[#4F8CFF]/10" : "bg-[#1E232F]"
                                    }`}>
                                    <Mail className={`w-5 h-5 ${emailEnabled ? "text-[#4F8CFF]" : "text-[#5C6270]"}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-white font-medium">Email Notifications</p>
                                    <p className="text-xs text-[#5C6270]">Get updates in your inbox</p>
                                </div>
                            </div>
                            <ToggleSwitch enabled={emailEnabled} onChange={() => setEmailEnabled(!emailEnabled)} />
                        </div>
                    </div>
                </div>

                {/* Sound Toggle */}
                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${soundEnabled ? "bg-[#F4D03F]/10" : "bg-[#1E232F]"
                                }`}>
                                {soundEnabled ? (
                                    <Volume2 className="w-5 h-5 text-[#F4D03F]" />
                                ) : (
                                    <VolumeX className="w-5 h-5 text-[#5C6270]" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">Notification Sounds</p>
                                <p className="text-xs text-[#5C6270]">Play sounds for push notifications</p>
                            </div>
                        </div>
                        <ToggleSwitch enabled={soundEnabled} onChange={() => setSoundEnabled(!soundEnabled)} />
                    </div>
                </div>
            </section>

            {/* Activity Notifications */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-[#5C6270] uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">
                        Activity Notifications
                    </h2>
                    <div className="flex items-center gap-6 text-xs text-[#5C6270]">
                        <span className="w-16 text-center">Push</span>
                        <span className="w-16 text-center">Email</span>
                    </div>
                </div>

                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] divide-y divide-[#2A2F3A]">
                    {/* Quick Toggle All Row */}
                    <div className="flex items-center justify-between p-4 bg-[#171B22]">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#2A2F3A] flex items-center justify-center">
                                <Bell className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">All Notifications</p>
                                <p className="text-xs text-[#5C6270]">Toggle all at once</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="w-16 flex justify-center">
                                <ToggleSwitch
                                    enabled={allPushEnabled}
                                    onChange={toggleAllPush}
                                    size="small"
                                />
                            </div>
                            <div className="w-16 flex justify-center">
                                <ToggleSwitch
                                    enabled={allEmailEnabled}
                                    onChange={toggleAllEmail}
                                    size="small"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Individual Preferences */}
                    {preferences.map((pref) => (
                        <div key={pref.type} className="flex items-center justify-between p-4 hover:bg-[#1E232F] transition-colors">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: `${pref.iconColor}15` }}
                                >
                                    <div style={{ color: pref.iconColor }}>
                                        {pref.icon}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-white font-medium">{pref.label}</p>
                                    <p className="text-xs text-[#5C6270]">{pref.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="w-16 flex justify-center">
                                    <ToggleSwitch
                                        enabled={pref.push && pushEnabled}
                                        onChange={() => togglePreference(pref.type, "push")}
                                        size="small"
                                    />
                                </div>
                                <div className="w-16 flex justify-center">
                                    <ToggleSwitch
                                        enabled={pref.email && emailEnabled}
                                        onChange={() => togglePreference(pref.type, "email")}
                                        size="small"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Quiet Hours */}
            <section className="space-y-4">
                <h2 className="text-xs font-bold text-[#5C6270] uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">
                    Quiet Hours
                </h2>

                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#9B59B6]/10 flex items-center justify-center">
                                <Moon className="w-5 h-5 text-[#9B59B6]" />
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">Do Not Disturb</p>
                                <p className="text-xs text-[#5C6270]">Pause notifications during specific hours</p>
                            </div>
                        </div>
                        <ToggleSwitch enabled={false} onChange={() => { }} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 opacity-50 pointer-events-none">
                        <div>
                            <label className="text-xs text-[#5C6270] mb-2 block">From</label>
                            <select className="w-full bg-[#171B22] border border-[#2A2F3A] rounded-lg px-4 py-2 text-white text-sm">
                                <option>10:00 PM</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-[#5C6270] mb-2 block">To</label>
                            <select className="w-full bg-[#171B22] border border-[#2A2F3A] rounded-lg px-4 py-2 text-white text-sm">
                                <option>8:00 AM</option>
                            </select>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
