"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage("");
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                if (data.resetLink) {
                    (window as any)._lastResetLink = data.resetLink;
                }
            } else {
                setError(data.error || "An error occurred");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h1>
                    <p className="text-gray-600">Enter your email to reset your password</p>
                </div>

                {message && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm break-all">
                        <p>{message}</p>
                        {/* Ensure the link inside message is clickable if we want to show it directly */}
                    </div>
                )}

                {/* For testing: Show the link directly if provided by API */}
                {message && (
                    <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 break-all">
                        <strong>Dev Link:</strong> <br />
                        <a href={(window as any)._lastResetLink} className="underline text-blue-600">Click here to reset password</a>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            placeholder="Enter your email"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Sending link..." : "Send Reset Link"}
                    </button>
                </form>

                <div className="text-center">
                    <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                        Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
