"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/register" });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getInitial = (email: string | null | undefined) => {
    if (!email) return "?";
    return email.charAt(0).toUpperCase();
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Home */}
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className={`text-xl font-bold ${isActive("/") ? "text-indigo-600" : "text-gray-800"
                } hover:text-indigo-600 transition`}
            >
              Social Media App
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {/* Home Link - Always visible */}
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive("/")
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                }`}
            >
              Home
            </Link>

            {/* Upload Link - Only if logged in */}
            {status === "authenticated" && (
              <Link
                href="/upload"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive("/upload")
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  }`}
              >
                Upload Videos
              </Link>
            )}

            {/* Auth Section */}
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : status === "authenticated" && session?.user?.email ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  aria-label="User menu"
                >
                  {getInitial(session.user.email)}
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {session.user.email}
                        </p>
                      </div>
                      <Link
                        href="/settings/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        onClick={() => setShowDropdown(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

