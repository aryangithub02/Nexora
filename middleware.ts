import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isVerifyPage = req.nextUrl.pathname === "/auth/verify-2fa";
    const isSetupPage = req.nextUrl.pathname === "/auth/setup-2fa";
    const is2FAApi = req.nextUrl.pathname.startsWith("/api/account/2fa");

    const isApi = req.nextUrl.pathname.startsWith("/api/");

    if (token?.requires2FASetup && !isSetupPage && !is2FAApi) {
      if (isApi) return NextResponse.json({ error: "2FA Setup Required" }, { status: 403 });
      return NextResponse.redirect(new URL("/auth/setup-2fa", req.url));
    }

    if (token?.requires2FA && !isVerifyPage && !token.requires2FASetup && !is2FAApi) {
      if (isApi) return NextResponse.json({ error: "2FA Verification Required" }, { status: 403 });
      return NextResponse.redirect(new URL("/auth/verify-2fa", req.url));
    }

    if (token && !token.requires2FA && isVerifyPage) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (token && !token.requires2FASetup && isSetupPage) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

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

        if (
          pathname === "/" ||
          pathname.startsWith("/api/") ||
          pathname === "/upload" ||
          pathname === "/logo.png" ||
          /\.(?:svg|png|jpg|jpeg|gif|webp)$/.test(pathname)
        ) {
          return true;
        }
        
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    
    "/((?!api/auth|api/uploadthing|_next|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|login|register|forgot-password|reset-password|\\.well-known).*)",
  ],
};
