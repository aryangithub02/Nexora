import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            requires2FA?: boolean;
            requires2FASetup?: boolean;
        } & DefaultSession["user"];
    }

    interface User {
        id?: string;
        tokenVersion?: number;
        twoFactorEnabled?: boolean;
        requires2FASetup?: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        tokenVersion?: number;
        requires2FA?: boolean;
        isTwoFactorVerified?: boolean;
        requires2FASetup?: boolean;
    }
}
