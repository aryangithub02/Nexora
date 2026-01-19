import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isVerifyPage = req.nextUrl.pathname === "/auth/verify-2fa";
    const isSetupPage = req.nextUrl.pathname === "/auth/setup-2fa";
    const is2FAApi = req.nextUrl.pathname.startsWith("/api/account/2fa");

    // API Route Check
    const isApi = req.nextUrl.pathname.startsWith("/api/");

    if (token?.requires2FASetup && !isSetupPage && !is2FAApi) {
      if (isApi) return NextResponse.json({ error: "2FA Setup Required" }, { status: 403 });
      return NextResponse.redirect(new URL("/auth/setup-2fa", req.url));
    }

    // If setup is required, don't fallback to verify logic or other redirects until setup is done, unless we are on setup page

    if (token?.requires2FA && !isVerifyPage && !token.requires2FASetup && !is2FAApi) {
      if (isApi) return NextResponse.json({ error: "2FA Verification Required" }, { status: 403 });
      return NextResponse.redirect(new URL("/auth/verify-2fa", req.url));
    }

    // Prevent access to verify page if 2FA not required
    if (token && !token.requires2FA && isVerifyPage) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Prevent access to setup page if not required
    if (token && !token.requires2FASetup && isSetupPage) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow auth-related routes
        if (
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/account/2fa") ||
          pathname === "/login" ||
          pathname === "/register" ||
          pathname === "/forgot-password" ||
          pathname === "/reset-password" ||
          pathname === "/auth/verify-2fa" ||
          pathname === "/auth/setup-2fa"
        ) {
          return true;
        }

        // Public routes & API (Let API routes pass through to be handled by Route Handlers or above middleware logic)
        if (pathname === "/" || pathname.startsWith("/api/") || pathname === "/upload") {
          return true;
        }
        // All other routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|api/uploadthing|_next|favicon.ico|login|\\.well-known).*)",
  ],
};
