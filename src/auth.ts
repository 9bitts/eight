import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
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
  providers: [doctor8Provider()],
  debug: process.env.AUTH_DEBUG === "true",
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      if (account?.provider !== "doctor8") return true;
      const role = (profile as { role?: string } | undefined)?.role;
      if (role && !DOCTOR8_SSO_ROLES.has(role)) return false;
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        token.id = user.id;
      }

      if (token.id) {
        const profile = await prisma.profile.findUnique({
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
        if (profile) {
          if (profile.suspended) {
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
            token.profileId = profile.id;
            token.handle = profile.handle;
            token.verified = profile.verified;
            token.verificationStatus = profile.verificationStatus;
            token.isAdmin =
              profile.user.isAdmin ||
              adminEmails.includes(profile.user.email?.toLowerCase() ?? "");
          }
        } else {
          delete token.profileId;
          delete token.handle;
          delete token.verified;
          delete token.verificationStatus;
          delete token.isAdmin;
        }
      }

      return token;
    },
  },
});
