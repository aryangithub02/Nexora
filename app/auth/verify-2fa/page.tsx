"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, ArrowRight, KeyRound } from "lucide-react";

export default function VerifyTwoFactor() {
    const { data: session, update, status } = useSession();
    const router = useRouter();
    const [code, setCode] = useState("");
    const [isBackup, setIsBackup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Redirect if not authenticated or if 2FA is already satisfied
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated" && !(session?.user as any)?.requires2FA) {
            router.push("/");
        }
    }, [status, session, router]);

    const expectedLength = isBackup ? 8 : 6;
    const isCodeValid = code.length === expectedLength;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side validation
        if (!isCodeValid) {
            setError(isBackup
                ? "Backup code must be exactly 8 characters."
                : "Code must be exactly 6 digits.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Attempt to update the session with the provided OTP/Backup code
            // The logic in [...nextauth].ts -> jwt callback will verify this
            const newSession = await update({ otp: code });

            if ((newSession?.user as any)?.requires2FA === false) {
                router.push("/");
                router.refresh();
            } else {
                setError("Invalid code. Please try again.");
            }
        } catch (err) {
            console.error("Verification failed", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || (status === "authenticated" && !(session?.user as any)?.requires2FA)) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black text-white">
                <div className="animate-pulse flex flex-col items-center">
                    <ShieldCheck className="w-12 h-12 text-pink-500 mb-4" />
                    <p className="text-gray-400">Verifying session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-black p-4">
            <div className="w-full max-w-md relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>

                <div className="relative bg-[#0a0a0a] rounded-xl border border-white/10 p-8 shadow-2xl">
                    <div className="flex justify-center mb-6">
                        <div className="p-3 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full border border-white/5">
                            <ShieldCheck className="w-8 h-8 text-pink-400" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-center text-white mb-2 tracking-tight">
                        Two-Factor Authentication
                    </h2>
                    <p className="text-center text-gray-400 mb-8">
                        {isBackup
                            ? "Enter one of your 8-character backup codes."
                            : "Enter the 6-digit code from your authenticator app."}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">
                                {isBackup ? "Backup Code" : "Authentication Code"}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    {isBackup ? <KeyRound className="h-5 w-5 text-gray-500" /> : <Lock className="h-5 w-5 text-gray-500" />}
                                </div>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => {
                                        const value = e.target.value.trim();
                                        // For OTP, only allow digits; for backup, allow alphanumeric
                                        if (isBackup) {
                                            setCode(value.toUpperCase().slice(0, 8));
                                        } else {
                                            setCode(value.replace(/\D/g, '').slice(0, 6));
                                        }
                                    }}
                                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-gray-500 transition-all font-mono tracking-widest text-center text-lg"
                                    placeholder={isBackup ? "XXXXXXXX" : "000000"}
                                    maxLength={expectedLength}
                                    minLength={expectedLength}
                                    pattern={isBackup ? "[A-Za-z0-9]{8}" : "[0-9]{6}"}
                                    required
                                    autoFocus
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center animate-shake">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !isCodeValid}
                            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform transition hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Verify <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        {/* Character count indicator */}
                        <p className="text-center text-xs text-white">
                            {code.length} / {expectedLength} characters
                        </p>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsBackup(!isBackup);
                                setCode("");
                                setError("");
                            }}
                            className="text-sm text-gray-500 hover:text-white transition-colors underline decoration-dotted underline-offset-4"
                        >
                            {isBackup
                                ? "Use Authenticator App instead"
                                : "Lost your device? Use a backup code"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
