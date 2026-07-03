import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";

// OAuth desativado temporariamente — login apenas por e-mail/senha.
const oauthProviders: never[] = [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...oauthProviders,
    Credentials({
      name: "credentials",
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
        if (!user?.passwordHash || !user.profile) return null;
        if (user.profile.suspended) return null;

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
          name: user.profile.displayName,
          image: user.image,
          handle: user.profile.handle,
          verified: user.profile.verified,
          verificationStatus: user.profile.verificationStatus,
          isAdmin,
          profileId: user.profile.id,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
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
            adminEmails.includes(profile.user.email.toLowerCase());
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
