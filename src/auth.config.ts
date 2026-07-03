import type { NextAuthConfig } from "next-auth";
import { sanitizeCallbackUrl } from "@/lib/auth-redirect";

export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/signup/complete",
    error: "/login/erro",
  },
  session: { strategy: "jwt", updateAge: 60 },
  providers: [],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("http://") || url.startsWith("https://")) {
        try {
          const parsed = new URL(url);
          if (parsed.origin !== baseUrl) return `${baseUrl}/feed`;
          const path = parsed.pathname + parsed.search;
          return `${baseUrl}${sanitizeCallbackUrl(path, baseUrl)}`;
        } catch {
          return `${baseUrl}/feed`;
        }
      }
      const path = url.startsWith("/") ? url : `/${url}`;
      return `${baseUrl}${sanitizeCallbackUrl(path, baseUrl)}`;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.id = user.id;
        token.handle = user.handle;
        token.verified = user.verified;
        token.verificationStatus = user.verificationStatus;
        token.isAdmin = user.isAdmin;
        token.profileId = user.profileId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.handle = token.handle as string | undefined;
        session.user.verified = token.verified as boolean | undefined;
        session.user.verificationStatus = token.verificationStatus as
          | "PENDING"
          | "VERIFIED"
          | "REJECTED"
          | undefined;
        session.user.isAdmin = token.isAdmin as boolean | undefined;
        session.user.profileId = token.profileId as string | undefined;
        session.user.suspended = token.suspended as boolean | undefined;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
