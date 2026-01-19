"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, Key, Loader2, CheckCircle2, Copy } from "lucide-react";
import Image from "next/image";

export default function SetupTwoFactor() {
    const { data: session, update, status } = useSession();
    const router = useRouter();
    const [step, setStep] = useState<"init" | "verify">("init");
    const [secret, setSecret] = useState("");
    const [qrCode, setQrCode] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login"); // Middlewar will handle this anyway
        }
    }, [status, router]);

    const initSetup = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/account/2fa/setup", { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSecret(data.secret);
            setQrCode(data.qrCodeUrl);
            setStep("verify");
        } catch (err: any) {
            setError(err.message || "Failed to start setup");
        } finally {
            setLoading(false);
        }
    };

    const verifySetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/account/2fa/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Trigger session update because 2FA is now enabled
            // We pass a special status or just trigger update which forces JWT refresh
            await update({ status: "2fa_setup_complete" });

            router.push("/");
            router.refresh();

        } catch (err: any) {
            setError(err.message || "Invalid code");
        } finally {
            setLoading(false);
        }
    };

    const copySecret = () => {
        navigator.clipboard.writeText(secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    if (status === "loading") {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">

                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-white/10 mb-4">
                            <Shield className="w-8 h-8 text-pink-500" />
                        </div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Secure Your Account
                        </h1>
                        <p className="text-gray-400 text-sm mt-2">
                            Two-factor authentication is required to continue.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {step === "init" && (
                        <div className="space-y-6">
                            <div className="bg-white/5 rounded-lg p-6 border border-white/10 text-center">
                                <Key className="w-10 h-10 text-purple-400 mx-auto mb-4" />
                                <h3 className="font-medium text-white mb-2">Authenticator App</h3>
                                <p className="text-sm text-gray-400">
                                    You'll need an authenticator app like Google Authenticator or Microsoft Authenticator.
                                </p>
                            </div>
                            <button
                                onClick={initSetup}
                                disabled={loading}
                                className="w-full py-3 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 group"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Start Setup"}
                            </button>
                        </div>
                    )}

                    {step === "verify" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-white rounded-xl p-4 w-fit mx-auto">
                                {qrCode && (
                                    <Image
                                        src={qrCode}
                                        alt="2FA QR Code"
                                        width={192}
                                        height={192}
                                        className="w-48 h-48"
                                    />
                                )}
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs text-center text-gray-500 uppercase tracking-wider">Or enter code manually</p>
                                <div
                                    onClick={copySecret}
                                    className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-colors group"
                                >
                                    <code className="font-mono text-pink-400 tracking-wider text-lg">
                                        {secret}
                                    </code>
                                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500 group-hover:text-white" />}
                                </div>
                            </div>

                            <form onSubmit={verifySetup} className="space-y-4 pt-4 border-t border-white/10">
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Enter 6-digit code</label>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.trim())}
                                        placeholder="000 000"
                                        className="w-full bg-[#0a0a0a] border border-white/20 rounded-lg px-4 py-3 text-center text-xl tracking-[0.5em] font-mono focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all outline-none"
                                        maxLength={6}
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || code.length < 6}
                                    className="w-full py-3 px-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 className="animate-spin mx-auto scale-75" /> : "Verify & Enable"}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
