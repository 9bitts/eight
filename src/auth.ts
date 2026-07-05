import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { doctor8Provider } from "@/lib/auth/doctor8-provider";
import { prisma } from "@/lib/prisma";

const DOCTOR8_SSO_ROLES = new Set([
  "PROFESSIONAL",
  "PSYCHOANALYST",
  "INTEGRATIVE_THERAPIST",
  "ADMIN",
]);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    doctor8Provider(),
    Credentials({
      id: "credentials",
      name: "E-mail e senha",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString() ?? "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { profile: true },
        });
        if (!user?.passwordHash) return null;
        if (user.profile?.suspended) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        const adminEmails =
          process.env.ADMIN_EMAILS?.split(",")
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean) ?? [];
        const isAdmin =
          user.isAdmin || adminEmails.includes(user.email.toLowerCase());

        return {
          id: user.id,
          email: user.email,
          name: user.profile?.displayName ?? user.name ?? user.email,
          image: user.image,
          handle: user.profile?.handle,
          verified: user.profile?.verified,
          verificationStatus: user.profile?.verificationStatus,
          isAdmin,
          profileId: user.profile?.id,
        };
      },
    }),
  ],
  debug: process.env.AUTH_DEBUG === "true",
  logger: {
    error(code, ...message) {
      console.error("[auth]", code, ...message);
    },
    warn(code, ...message) {
      console.warn("[auth]", code, ...message);
    },
    debug(code, ...message) {
      if (process.env.AUTH_DEBUG === "true") {
        console.debug("[auth]", code, ...message);
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      if (account?.provider !== "doctor8") return true;
      const role = (profile as { role?: string } | undefined)?.role;
      if (role && !DOCTOR8_SSO_ROLES.has(role)) return false;
      return true;
    },
    async jwt({ token, user, account, profile, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.id = user.id;
        token.handle = user.handle;
        token.verified = user.verified;
        token.verificationStatus = user.verificationStatus;
        token.isAdmin = user.isAdmin;
        token.profileId = user.profileId;
      }

      if (account?.provider === "doctor8" && profile && typeof profile === "object") {
        const role = (profile as { role?: string }).role;
        if (role) (token as { doctor8Role?: string }).doctor8Role = role;
      }

      if (trigger === "update" && session) {
        const s = session as Record<string, unknown>;
        if (s.handle !== undefined) token.handle = s.handle as string | undefined;
        if (s.verified !== undefined) token.verified = s.verified as boolean | undefined;
      }

      if (token.id) {
        try {
          const dbProfile = await prisma.profile.findUnique({
            where: { userId: token.id as string },
            select: {
              id: true,
              handle: true,
              verified: true,
              verificationStatus: true,
              suspended: true,
              user: { select: { isAdmin: true, email: true } },
            },
          });
          if (dbProfile) {
            if (dbProfile.suspended) {
              token.suspended = true;
              delete token.profileId;
              delete token.handle;
              delete token.verified;
              delete token.verificationStatus;
              delete token.isAdmin;
            } else {
              delete token.suspended;
              const adminEmails =
                process.env.ADMIN_EMAILS?.split(",")
                  .map((e) => e.trim().toLowerCase())
                  .filter(Boolean) ?? [];
              token.profileId = dbProfile.id;
              token.handle = dbProfile.handle;
              token.verified = dbProfile.verified;
              token.verificationStatus = dbProfile.verificationStatus;
              token.isAdmin =
                dbProfile.user.isAdmin ||
                adminEmails.includes(dbProfile.user.email?.toLowerCase() ?? "");
            }
          } else {
            delete token.profileId;
            delete token.handle;
            delete token.verified;
            delete token.verificationStatus;
            delete token.isAdmin;
          }
        } catch (err) {
          console.error("[auth] jwt profile lookup failed:", err);
        }
      }

      return token;
    },
  },
});
