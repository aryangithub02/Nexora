"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import {
    Mail,
    Lock,

    Shield,
    Download,
    Trash2,

    Eye,
    EyeOff,
    AlertTriangle,
    Key,
    RefreshCw,
    X,
    Check
} from "lucide-react";



import { Laptop, Smartphone, Monitor } from "lucide-react";

interface ISession {
    _id: string;
    deviceType: string;
    location: string;
    ipAddress: string;
    lastActive: string;
    isActive: boolean;
}

function SessionHistoryList() {
    const [sessions, setSessions] = useState<ISession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/sessions")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setSessions(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const getIcon = (type: string) => {
        if (type.includes("Mobile")) return <Smartphone className="w-5 h-5 text-[#4F8CFF]" />;
        if (type.includes("Tablet")) return <Laptop className="w-5 h-5 text-[#2DE2A6]" />;
        return <Monitor className="w-5 h-5 text-[#F4D03F]" />; // Desktop default
    };

    if (loading) return <div className="p-6 text-center text-[#5C6270] text-xs">Loading sessions...</div>;

    return (
        <div className="divide-y divide-[#2A2F3A]">
            {sessions.map(session => (
                <div key={session._id} className="p-4 flex items-center justify-between hover:bg-[#171B22] transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#2A2F3A]/50 flex items-center justify-center">
                            {getIcon(session.deviceType)}
                        </div>
                        <div>
                            <p className="text-sm text-white font-medium">{session.deviceType}</p>
                            <div className="flex items-center gap-2 text-xs text-[#5C6270]">
                                <span>{session.location !== "Unknown" ? session.location : session.ipAddress}</span>
                                <span>•</span>
                                <span className={session.isActive ? "text-[#2DE2A6]" : ""}>
                                    {session.isActive ? "Active Now" : new Date(session.lastActive).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            {sessions.length === 0 && (
                <div className="p-6 text-center text-[#5C6270] text-xs">No recent sessions found.</div>
            )}
        </div>
    );
}

export default function AccountSettings() {
    const { data: session } = useSession();

    const [isChangingEmail, setIsChangingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [emailStep, setEmailStep] = useState<"input" | "verify">("input");
    const [emailOtp, setEmailOtp] = useState("");
    const [loadingEmail, setLoadingEmail] = useState(false);

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loadingPass, setLoadingPass] = useState(false);

    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [twoFactorCode, setTwoFactorCode] = useState("");
    const [loading2FA, setLoading2FA] = useState(false);

    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [showBackupModal, setShowBackupModal] = useState(false);
    const [loadingBackup, setLoadingBackup] = useState(false);



    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deletePassword, setDeletePassword] = useState("");
    const [loadingDelete, setLoadingDelete] = useState(false);

    const [downloading, setDownloading] = useState(false);

    const [privacy, setPrivacy] = useState({
        isPublic: true,
        requireFollowApproval: false,
        commentPermission: 'everyone',
        mentionPermission: 'everyone',
        appearInDiscover: true,
        allowSuggestions: true
    });
    const [loadingPrivacy, setLoadingPrivacy] = useState(true);

    useEffect(() => {
        fetch("/api/settings/privacy", { method: "PATCH", body: JSON.stringify({}) }) // Using empty patch to get current or use GET if implemented
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setPrivacy(prev => ({ ...prev, ...data }));
                }
                setLoadingPrivacy(false);
            })
            .catch(err => console.error(err));
    }, []);

    const updatePrivacy = async (key: string, value: any) => {
        // Optimistic update
        setPrivacy(prev => ({ ...prev, [key]: value }));
        try {
            const res = await fetch("/api/settings/privacy", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [key]: value })
            });
            if (!res.ok) throw new Error("Failed to update");
        } catch (error) {
            console.error("Privacy update failed", error);
            // Revert?
        }
    };



    useEffect(() => {
        // Check if 2FA is enabled (could be part of session user or separate profile fetch)
        // For now, we default to false or rely on user to know. 
        // Ideally we fetch a 'user security status' endpoint.
    }, []);

    // Handlers

    // 1. Email
    const initiateEmailChange = async () => {
        if (!newEmail.includes("@")) return alert("Invalid email");
        setLoadingEmail(true);
        try {
            const res = await fetch("/api/account/email/init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newEmail }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setEmailStep("verify");
            alert(data.message); // In dev, this might be "Sent to console"
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoadingEmail(false);
        }
    };

    const verifyEmailChange = async () => {
        setLoadingEmail(true);
        try {
            const res = await fetch("/api/account/email/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otp: emailOtp }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            alert(data.message);
            setIsChangingEmail(false);
            setEmailStep("input");
            setNewEmail("");
            setEmailOtp("");
            // Force re-login or update session?
            signOut();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoadingEmail(false);
        }
    };

    // 2. Password
    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) return alert("Passwords do not match");
        setLoadingPass(true);
        try {
            const res = await fetch("/api/account/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            alert(data.message);
            setIsChangingPassword(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            // Optional: signOut()
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoadingPass(false);
        }
    };

    // 3. 2FA
    const toggle2FA = async () => {
        if (twoFactorEnabled) {
            // Disable
            if (!confirm("Disable 2FA? This reduces security.")) return;
            try {
                await fetch("/api/account/2fa/disable", { method: "POST" });
                setTwoFactorEnabled(false);
            } catch (e) { console.error(e); }
        } else {
            // Enable -> Show Setup
            setLoading2FA(true);
            try {
                const res = await fetch("/api/account/2fa/setup", { method: "POST" });
                const data = await res.json();
                if (data.qrCodeUrl) {
                    setQrCodeUrl(data.qrCodeUrl);
                    setShow2FAModal(true);
                }
            } catch (e) {
                console.error(e);
                alert("Setup failed");
            } finally {
                setLoading2FA(false);
            }
        }
    };

    const confirm2FASetup = async () => {
        try {
            const res = await fetch("/api/account/2fa/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: twoFactorCode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setTwoFactorEnabled(true);
            setShow2FAModal(false);
            setTwoFactorCode("");
            alert("2FA Enabled!");
        } catch (e: any) {
            alert(e.message);
        }
    };

    // 4. Backup Codes
    const generateBackupCodes = async () => {
        setLoadingBackup(true);
        try {
            const res = await fetch("/api/account/2fa/backup", { method: "POST" });
            const data = await res.json();
            if (data.codes) {
                setBackupCodes(data.codes);
                setShowBackupModal(true);
            }
        } catch (e) { console.error(e); }
        finally { setLoadingBackup(false); }
    };



    // 6. Data
    const downloadData = async () => {
        setDownloading(true);
        try {
            const res = await fetch("/api/account/download", { method: "POST" });
            const data = await res.json();
            alert(data.message);
        } catch (e) { console.error(e); }
        finally { setDownloading(false); }
    };

    // 7. Delete
    const deleteAccount = async () => {
        if (deleteConfirmText !== "DELETE") return;
        if (!deletePassword) return alert("Password required");
        setLoadingDelete(true);
        try {
            const res = await fetch("/api/account/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: deletePassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            alert(data.message);
            signOut({ callbackUrl: "/register" });
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoadingDelete(false);
        }
    };


    return (
        <div className="space-y-12 relative z-10 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
                    Account
                </h1>
                <p className="text-sm text-[#5C6270] mt-1 font-[family-name:var(--font-inter)]">
                    Manage your identity and security settings
                </p>
            </div>

            {/* Email & Password */}
            <section className="space-y-6">
                <h2 className="text-xs font-bold text-[#5C6270] uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">Email & Password</h2>

                {/* Email Panel */}
                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#4F8CFF]/10 flex items-center justify-center">
                                <Mail className="w-5 h-5 text-[#4F8CFF]" />
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">{session?.user?.email}</p>
                                <p className="text-xs text-[#5C6270]">Primary email address</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsChangingEmail(!isChangingEmail)}
                            className="text-xs text-[#4F8CFF] hover:text-white transition-colors font-medium"
                        >
                            {isChangingEmail ? "Cancel" : "Change"}
                        </button>
                    </div>

                    {isChangingEmail && (
                        <div className="mt-4 pt-4 border-t border-[#2A2F3A] space-y-4 animate-in slide-in-from-top-2">
                            {emailStep === "input" ? (
                                <div className="space-y-3">
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={e => setNewEmail(e.target.value)}
                                        placeholder="New email address"
                                        className="w-full bg-[#171B22] border border-[#2A2F3A] rounded-lg px-4 py-3 text-white text-sm focus:border-[#4F8CFF] outline-none"
                                    />
                                    <button
                                        onClick={initiateEmailChange}
                                        disabled={loadingEmail}
                                        className="px-6 py-2 bg-[#4F8CFF] text-white text-sm font-medium rounded-lg hover:bg-[#3D7AE8] disabled:opacity-50"
                                    >
                                        {loadingEmail ? "Sending..." : "Verify New Email"}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-xs text-[#5C6270]">Enter the 6-digit code sent to {newEmail}</p>
                                    <input
                                        type="text"
                                        value={emailOtp}
                                        onChange={e => setEmailOtp(e.target.value)}
                                        placeholder="000000"
                                        className="w-full bg-[#171B22] border border-[#2A2F3A] rounded-lg px-4 py-3 text-white text-sm focus:border-[#4F8CFF] outline-none tracking-widest font-mono"
                                    />
                                    <button
                                        onClick={verifyEmailChange}
                                        disabled={loadingEmail}
                                        className="px-6 py-2 bg-[#2DE2A6] text-[#0F1117] text-sm font-bold rounded-lg hover:bg-[#26c08d] disabled:opacity-50"
                                    >
                                        {loadingEmail ? "Verifying..." : "Confirm Change"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Password Panel */}
                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#2DE2A6]/10 flex items-center justify-center">
                                <Lock className="w-5 h-5 text-[#2DE2A6]" />
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">Password</p>
                                <p className="text-xs text-[#5C6270]">Security is important</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsChangingPassword(!isChangingPassword)}
                            className="text-xs text-[#4F8CFF] hover:text-white transition-colors font-medium"
                        >
                            {isChangingPassword ? "Cancel" : "Change"}
                        </button>
                    </div>

                    {isChangingPassword && (
                        <div className="mt-4 pt-4 border-t border-[#2A2F3A] space-y-4 animate-in slide-in-from-top-2">
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                placeholder="Current password"
                                className="w-full bg-[#171B22] border border-[#2A2F3A] rounded-lg px-4 py-3 text-white text-sm focus:border-[#4F8CFF] outline-none"
                            />
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="New password"
                                className="w-full bg-[#171B22] border border-[#2A2F3A] rounded-lg px-4 py-3 text-white text-sm focus:border-[#4F8CFF] outline-none"
                            />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="w-full bg-[#171B22] border border-[#2A2F3A] rounded-lg px-4 py-3 text-white text-sm focus:border-[#4F8CFF] outline-none"
                            />
                            <button
                                onClick={handlePasswordChange}
                                disabled={loadingPass}
                                className="px-6 py-2 bg-[#2DE2A6] text-[#0F1117] text-sm font-bold rounded-lg hover:bg-[#26c08d] disabled:opacity-50"
                            >
                                {loadingPass ? "Updating..." : "Update Password"}
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Security Status */}
            <section className="space-y-6">
                <h2 className="text-xs font-bold text-[#5C6270] uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">Security Status</h2>

                {/* 2FA */}
                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${twoFactorEnabled ? "bg-[#2DE2A6]/10" : "bg-[#FF6B6B]/10"}`}>
                                <Shield className={`w-5 h-5 ${twoFactorEnabled ? "text-[#2DE2A6]" : "text-[#FF6B6B]"}`} />
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">Two-Factor Authentication</p>
                                <p className="text-xs text-[#5C6270]">{twoFactorEnabled ? "Enabled" : "Disabled"}</p>
                            </div>
                        </div>
                        <button
                            onClick={toggle2FA}
                            disabled={loading2FA}
                            className={`relative w-12 h-6 rounded-full transition-colors ${twoFactorEnabled ? "bg-[#2DE2A6]" : "bg-[#2A2F3A]"}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${twoFactorEnabled ? "left-7" : "left-1"}`} />
                        </button>
                    </div>
                </div>

                {/* Backup Codes */}
                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#F4D03F]/10 flex items-center justify-center">
                                <Key className="w-5 h-5 text-[#F4D03F]" />
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">Backup Codes</p>
                                <p className="text-xs text-[#5C6270]">Generate recovery codes</p>
                            </div>
                        </div>
                        <button
                            onClick={generateBackupCodes}
                            disabled={loadingBackup}
                            className="flex items-center gap-2 text-xs text-[#4F8CFF] hover:text-white transition-colors font-medium"
                        >
                            <RefreshCw size={14} className={loadingBackup ? "animate-spin" : ""} />
                            Generate
                        </button>
                    </div>
                </div>
            </section>

            {/* Privacy & Visibility */}
            <section className="space-y-6">
                <h2 className="text-xs font-bold text-[#5C6270] uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">Privacy & Visibility</h2>

                {/* Private Account */}
                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#9B59B6]/10 flex items-center justify-center">
                                <Lock className="w-5 h-5 text-[#9B59B6]" />
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">Private Account</p>
                                <p className="text-xs text-[#5C6270]">Only followers can see your posts</p>
                            </div>
                        </div>
                        <button
                            onClick={() => updatePrivacy('isPublic', !privacy.isPublic)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${!privacy.isPublic ? "bg-[#9B59B6]" : "bg-[#2A2F3A]"}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${!privacy.isPublic ? "left-7" : "left-1"}`} />
                        </button>
                    </div>
                    {/* Follow Approval (Linked to Private for simplicity or separate?) */}
                    {/* For now keeping them decoupled in UI but conceptually linked */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2A2F3A]">
                        <div>
                            <p className="text-sm text-white font-medium">Require Follow Approval</p>
                            <p className="text-xs text-[#5C6270]">Review every new follower</p>
                        </div>
                        <button
                            onClick={() => updatePrivacy('requireFollowApproval', !privacy.requireFollowApproval)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${privacy.requireFollowApproval ? "bg-[#9B59B6]" : "bg-[#2A2F3A]"}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${privacy.requireFollowApproval ? "left-7" : "left-1"}`} />
                        </button>
                    </div>
                </div>

                {/* Interactions */}
                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white font-medium">Allow Comments From</p>
                        </div>
                        <select
                            value={privacy.commentPermission}
                            onChange={(e) => updatePrivacy('commentPermission', e.target.value)}
                            className="bg-[#171B22] border border-[#2A2F3A] text-white text-xs rounded-lg px-2 py-1 outline-none focus:border-[#4F8CFF]"
                        >
                            <option value="everyone">Everyone</option>
                            <option value="followers">Followers</option>
                            <option value="no_one">No One</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white font-medium">Allow Mentions From</p>
                        </div>
                        <select
                            value={privacy.mentionPermission}
                            onChange={(e) => updatePrivacy('mentionPermission', e.target.value)}
                            className="bg-[#171B22] border border-[#2A2F3A] text-white text-xs rounded-lg px-2 py-1 outline-none focus:border-[#4F8CFF]"
                        >
                            <option value="everyone">Everyone</option>
                            <option value="followers">Followers</option>
                        </select>
                    </div>
                </div>

                {/* Discovery */}
                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white font-medium">Show in Discover</p>
                            <p className="text-xs text-[#5C6270]">Let others find your profile in search/discover</p>
                        </div>
                        <button
                            onClick={() => updatePrivacy('appearInDiscover', !privacy.appearInDiscover)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${privacy.appearInDiscover ? "bg-[#4F8CFF]" : "bg-[#2A2F3A]"}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${privacy.appearInDiscover ? "left-7" : "left-1"}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white font-medium">Allow Profile Suggestions</p>
                            <p className="text-xs text-[#5C6270]">Suggest your account to others</p>
                        </div>
                        <button
                            onClick={() => updatePrivacy('allowSuggestions', !privacy.allowSuggestions)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${privacy.allowSuggestions ? "bg-[#4F8CFF]" : "bg-[#2A2F3A]"}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${privacy.allowSuggestions ? "left-7" : "left-1"}`} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Data Ownership */}
            <section className="space-y-6">
                <h2 className="text-xs font-bold text-[#5C6270] uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">Data Ownership</h2>

                {/* Download */}
                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#4F8CFF]/10 flex items-center justify-center">
                                <Download className="w-5 h-5 text-[#4F8CFF]" />
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">Download My Data</p>
                                <p className="text-xs text-[#5C6270]">Get a copy of everything</p>
                            </div>
                        </div>
                        <button
                            onClick={downloadData}
                            disabled={downloading}
                            className="px-4 py-2 bg-[#1E232F] text-white text-xs font-medium rounded-lg hover:bg-[#2A2F3A] border border-[#2A2F3A]"
                        >
                            {downloading ? "Requesting..." : "Request Download"}
                        </button>
                    </div>
                </div>

                {/* Delete */}
                <div className="bg-[#0F1117] rounded-xl border border-[#FF6B6B]/20 p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#FF6B6B]/10 flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-[#FF6B6B]" />
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">Delete Account</p>
                                <p className="text-xs text-[#5C6270]">Permanently delete your account</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2 text-[#FF6B6B] text-xs font-medium rounded-lg hover:bg-[#FF6B6B]/10 border border-[#FF6B6B]/30"
                        >
                            Delete Account
                        </button>
                    </div>

                    {showDeleteConfirm && (
                        <div className="mt-4 pt-4 border-t border-[#FF6B6B]/20 space-y-4 animate-in slide-in-from-top-2">
                            <div className="flex items-start gap-3 p-3 bg-[#FF6B6B]/10 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-[#FF6B6B] shrink-0 mt-0.5" />
                                <p className="text-xs text-[#FF6B6B]">
                                    This action cannot be undone. All data will be lost.
                                </p>
                            </div>
                            <div>
                                <label className="text-xs text-[#5C6270] mb-2 block">Type DELETE to confirm</label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    className="w-full bg-[#171B22] border border-[#FF6B6B]/30 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF6B6B] outline-none"
                                    placeholder="DELETE"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-[#5C6270] mb-2 block">Confirm Password</label>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    className="w-full bg-[#171B22] border border-[#FF6B6B]/30 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF6B6B] outline-none"
                                    placeholder="Password"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); setDeletePassword(""); }}
                                    className="px-4 py-2 text-white text-xs font-medium rounded-lg hover:bg-[#1E232F]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={deleteAccount}
                                    disabled={deleteConfirmText !== "DELETE" || !deletePassword}
                                    className="px-4 py-2 bg-[#FF6B6B] text-white text-xs font-medium rounded-lg hover:bg-[#E55555] disabled:opacity-50"
                                >
                                    {loadingDelete ? "Deleting..." : "Permanently Delete"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Session History */}
            <section className="space-y-6">
                <h2 className="text-xs font-bold text-[#5C6270] uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">Session History</h2>

                <div className="bg-[#0F1117] rounded-xl border border-[#2A2F3A] overflow-hidden">
                    <SessionHistoryList />
                </div>
            </section>

            {/* Modals */}

            {/* 2FA Modal */}
            {show2FAModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#161B22] border border-[#2A2F3A] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white mb-2">Setup 2FA</h3>
                            <p className="text-[#5C6270] text-sm">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc).</p>
                        </div>
                        <div className="flex justify-center p-4 bg-white rounded-xl">
                            <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                        </div>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={twoFactorCode}
                                onChange={e => setTwoFactorCode(e.target.value)}
                                placeholder="Enter 6-digit code"
                                className="w-full bg-[#0F1117] border border-[#2A2F3A] rounded-lg px-4 py-3 text-white text-center tracking-[0.5em] font-mono text-lg focus:border-[#2DE2A6] outline-none"
                                maxLength={6}
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShow2FAModal(false)}
                                    className="flex-1 py-3 bg-[#1E232F] text-white font-medium rounded-lg hover:bg-[#2A2F3A]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirm2FASetup}
                                    className="flex-1 py-3 bg-[#2DE2A6] text-[#0F1117] font-bold rounded-lg hover:bg-[#26c08d]"
                                >
                                    Verify & Enable
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Backup Codes Modal */}
            {showBackupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#161B22] border border-[#2A2F3A] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white mb-2">Backup Codes</h3>
                            <p className="text-[#5C6270] text-sm">
                                Save these codes in a safe place. You can use each code once to log in if you lose access to your phone.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 p-4 bg-[#0F1117] rounded-xl border border-[#2A2F3A]">
                            {backupCodes.map((code, i) => (
                                <div key={i} className="font-mono text-[#2DE2A6] text-center text-sm py-1">
                                    {code}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowBackupModal(false)}
                            className="w-full py-3 bg-[#4F8CFF] text-white font-bold rounded-lg hover:bg-[#3D7AE8]"
                        >
                            I have saved them
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
