import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { authenticator } from "@otplib/preset-default";
import { connectToDatabase } from "./db";
import UserModel from "../models/User";
import Profile from "../models/Profile";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        try {
          await connectToDatabase();
          const user = await UserModel.findOne({ email: credentials.email });

          if (!user) {
            throw new Error("No user found with this email");
          }

          if (!user.password || typeof user.password !== 'string') {
            throw new Error("Invalid user data");
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user._id.toString(),
            email: user.email,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await connectToDatabase();
          let existingUser = await UserModel.findOne({ email: user.email });

          if (!existingUser) {
            existingUser = await UserModel.create({
              email: user.email,
            });
          }

          const existingProfile = await Profile.findOne({ userId: existingUser._id });
          if (!existingProfile) {
            const baseUsername = user.email?.split("@")[0] || "user";
            let uniqueUsername = baseUsername;
            let counter = 1;
            while (await Profile.findOne({ username: uniqueUsername })) {
              uniqueUsername = `${baseUsername}${counter}`;
              counter++;
            }

            await Profile.create({
              userId: existingUser._id,
              username: uniqueUsername,
              displayName: user.name || baseUsername,
              avatarUrl: user.image,
            });
          } else if (!existingProfile.avatarUrl && user.image) {
            existingProfile.avatarUrl = user.image;
            await existingProfile.save();
          }

        } catch (error) {
          console.error("Error creating Google user/profile:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user && account) {
        token.id = user.id;
        await connectToDatabase();
        const dbUser = await UserModel.findOne({ email: user.email });
        if (dbUser) {
          token.tokenVersion = dbUser.tokenVersion || 0;
          token.id = dbUser._id.toString();

          const profile = await Profile.findOne({ userId: dbUser._id });
          if (profile) {
            token.picture = profile.avatarUrl || token.picture;
            token.name = profile.displayName || token.name;
            token.username = profile.username;
          }

          if (dbUser.twoFactorEnabled) {
            token.requires2FA = true;
            token.isTwoFactorVerified = false;
          } else {
            token.requires2FASetup = true;
          }
        }
        return token;
      }

      // Handle Session Update
      if (trigger === "update") {
        // If verifying OTP
        if (session?.otp) {
          try {
            await connectToDatabase();
            const dbUser = await UserModel.findById(token.id);

            if (!dbUser || !dbUser.twoFactorEnabled || !dbUser.twoFactorSecret) {
              return token;
            }

            const otpCode = String(session.otp).trim();
            let isValid = false;

            // Validate and try TOTP (must be exactly 6 digits)
            if (/^\d{6}$/.test(otpCode)) {
              try {
                isValid = authenticator.verify({ token: otpCode, secret: dbUser.twoFactorSecret });
              } catch (e) {
                console.error("TOTP verification error:", e);
              }
            }

            // Try Backup Code (must be exactly 8 alphanumeric characters)
            if (!isValid && /^[A-Za-z0-9]{8}$/.test(otpCode) && dbUser.backupCodes && dbUser.backupCodes.length > 0) {
              const normalizedCode = otpCode.toUpperCase();
              const backupCodeIndex = dbUser.backupCodes.findIndex(
                (code: string) => code.toUpperCase() === normalizedCode
              );
              if (backupCodeIndex > -1) {
                isValid = true;
                dbUser.backupCodes.splice(backupCodeIndex, 1);
                await dbUser.save();
              }
            }

            if (isValid) {
              token.requires2FA = false;
              token.isTwoFactorVerified = true;
            }
          } catch (error) {
            console.error("2FA Update Error", error);
          }
        }

        // If setup complete
        if (session?.status === "2fa_setup_complete") {
          token.requires2FASetup = false;
          token.twoFactorEnabled = true;
          // Also assume they are verified since they just set it up
          token.requires2FA = false;
          token.isTwoFactorVerified = true;
        }

        return token;
      }

      // 2. Subsequent requests - Verify Token Version & Status
      try {
        await connectToDatabase();
        const dbUser = await UserModel.findById(token.id);

        if (!dbUser) {
          return {}; // Invalidate
        }

        if (dbUser.isDeleted) {
          return {}; // Invalidate
        }

        const currentTokenVersion = (token.tokenVersion as number) || 0;
        const dbTokenVersion = dbUser.tokenVersion || 0;

        if (currentTokenVersion < dbTokenVersion) {
          return {}; // Invalidate
        }

        // Fetch Profile only if missing data or strictly needed
        // We trust the token's existing profile data to reduce DB load
        if (!token.username || !token.picture) {
          const profile = await Profile.findOne({ userId: dbUser._id }).select('avatarUrl displayName username');
          if (profile) {
            token.picture = profile.avatarUrl || token.picture;
            token.name = profile.displayName || token.name;
            token.username = profile.username;
          }
        } else {
          // Optional: Occasionally refresh? For now, performance first.
          // If user updates profile, they should trigger session update client-side.
        }

        if (!token.name) {
          token.name = dbUser.name || token.name;
        }

        // Sync 2FA State
        if (dbUser.twoFactorEnabled) {
          token.requires2FASetup = false;
          // Note: We don't force re-verification here on every request if they were already verified in this session
          // But if they somehow disabled it and re-enabled it elsewhere, they might need to verify?
          // For now, trust the session state for 'isTwoFactorVerified' unless tokenVersion changed.
        } else {
          // User must have disabled it (or never had it). Force setup.
          token.requires2FASetup = true;
          token.requires2FA = false;
        }

      } catch (error) {
        console.error("Auth Middleware Error:", error);
        return {};
      }

      return token;
    },
    async session({ session, token }) {
      if (!token.id) {
        return session;
      }
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).requires2FA = token.requires2FA;
        (session.user as any).requires2FASetup = token.requires2FASetup;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};