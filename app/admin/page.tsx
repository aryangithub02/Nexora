
"use client";

import React, { useState, useEffect } from "react";
import { Shield, Users, RotateCcw, Lock, Key, Eye, EyeOff } from "lucide-react";

export default function AdminPage() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(data.users);
                setIsAdmin(true);
                // Store in session storage for refreshing
                sessionStorage.setItem("admin_user", username);
                sessionStorage.setItem("admin_pass", password);
            } else {
                setError(data.error || "Login failed");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        const u = sessionStorage.getItem("admin_user");
        const p = sessionStorage.getItem("admin_pass");
        if (!u || !p) return;

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: u, password: p })
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(data.users);
            }
        } catch (err) {
            console.error("Refresh failed");
        }
    };

    const handleReset2FA = async (userId: string) => {
        const u = sessionStorage.getItem("admin_user");
        const p = sessionStorage.getItem("admin_pass");
        if (!u || !p) return;

        if (!confirm("Are you sure you want to reset 2FA for this user?")) return;

        setLoading(true);
        try {
            const res = await fetch("/api/admin/users/reset-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: u, password: p, userId })
            });
            if (res.ok) {
                alert("2FA Reset successfully");
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.error || "Reset failed");
            }
        } catch (err) {
            alert("Error resetting 2FA");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const u = sessionStorage.getItem("admin_user");
        const p = sessionStorage.getItem("admin_pass");
        if (u === "admin" && p === "nexora@07") {
            setUsername(u);
            setPassword(p);
            setIsAdmin(true);
            fetchUsers();
        }
    }, []);

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#0b0e13] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[#121722] border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                            <Shield className="w-10 h-10 text-indigo-400" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-center text-white mb-2">Nexora Admin</h1>
                    <p className="text-gray-400 text-center mb-8">Access restricted to authorized personnel</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                placeholder="Admin Username"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition pr-10"
                                    placeholder="Admin Password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition shadow-lg flex items-center justify-center gap-2"
                        >
                            {loading ? "Verifying..." : "Login to Dashboard"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b0e13] text-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-8 bg-[#121722] p-6 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-500/20 p-3 rounded-xl border border-indigo-500/30">
                            <Shield className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Admin Panel</h1>
                            <p className="text-gray-400 text-sm">User & Security Management</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            sessionStorage.clear();
                            setIsAdmin(false);
                            setUsers([]);
                        }}
                        className="bg-red-600/10 hover:bg-red-600/20 text-red-500 px-4 py-2 rounded-lg border border-red-500/20 transition-all"
                    >
                        Sign Out
                    </button>
                </header>

                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-[#121722] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#161c29]">
                            <div className="flex items-center gap-2">
                                <Users size={20} className="text-indigo-400" />
                                <h2 className="text-xl font-semibold">User Management</h2>
                            </div>
                            <button
                                onClick={fetchUsers}
                                className="p-2 hover:bg-white/5 rounded-full transition-colors"
                                title="Refresh Users"
                            >
                                <RotateCcw size={18} />
                            </button>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse">
                                <thead className="bg-[#0b0e13] text-gray-400 text-sm uppercase">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-left">User Details</th>
                                        <th className="px-6 py-4 font-semibold text-left">Security Status</th>
                                        <th className="px-6 py-4 font-semibold text-left">Live OTP</th>
                                        <th className="px-6 py-4 font-semibold text-left">Backup Codes</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic bg-[#0a0a0a]/30">
                                                No users found in database.
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-6 min-w-[320px]">
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-semibold text-base" title={user.email}>
                                                            {user.email}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 font-mono mt-0.5 tracking-tight flex items-center gap-1">
                                                            <span className="opacity-40 uppercase">UID:</span> {user.id}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    {user.twoFactorEnabled ? (
                                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black tracking-widest uppercase">
                                                            <Shield size={12} />
                                                            Verified
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 text-gray-600 border border-white/5 text-[10px] font-bold tracking-widest uppercase">
                                                            <Lock size={12} className="opacity-30" />
                                                            Standard
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-6">
                                                    {user.twoFactorEnabled ? (
                                                        <div className="inline-flex items-center justify-center bg-indigo-600/10 px-4 py-2 rounded-xl border border-indigo-500/20 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]">
                                                            <span className="font-mono text-pink-500 tracking-[0.25em] font-black text-xl leading-none">
                                                                {user.currentCode}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-800 font-mono tracking-widest pl-4">------</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-6 min-w-[340px]">
                                                    {user.backupCodes && user.backupCodes.length > 0 ? (
                                                        <div className="grid grid-cols-2 gap-2 bg-black/40 rounded-xl border border-white/5 p-3 shadow-inner">
                                                            {user.backupCodes.map((bc: string, i: number) => (
                                                                <div key={i} className="flex items-center gap-2 group/code bg-[#0b0e13]/80 px-2 py-1.5 rounded border border-white/[0.03] hover:border-indigo-500/30 transition-all overflow-hidden">
                                                                    <span className="text-[8px] text-gray-700 font-mono font-bold w-3">{i + 1}</span>
                                                                    <code className="text-[10px] text-gray-400 font-mono break-all leading-tight flex-1 group-hover/code:text-white text-center min-w-[100px]">
                                                                        {bc}
                                                                    </code>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="h-12 flex items-center justify-center bg-white/[0.02] rounded-xl border border-dashed border-white/5 text-gray-700 text-[10px] font-bold uppercase tracking-widest">
                                                            No Codes
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-6 text-right whitespace-nowrap">
                                                    {user.twoFactorEnabled ? (
                                                        <button
                                                            onClick={() => handleReset2FA(user.id)}
                                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500/10 hover:bg-pink-500 text-pink-500 hover:text-white border border-pink-500/20 hover:border-pink-500 transition-all duration-300 text-xs font-bold active:scale-95 group/btn"
                                                        >
                                                            <RotateCcw size={14} className="group-active/btn:rotate-180 transition-transform duration-500" />
                                                            RESET 2FA
                                                        </button>
                                                    ) : (
                                                        <button disabled className="px-4 py-2 rounded-xl border border-white/5 text-gray-700 text-xs font-bold cursor-not-allowed uppercase opacity-30">
                                                            Not Required
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}




