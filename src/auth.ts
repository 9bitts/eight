import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Twitter from "next-auth/providers/twitter";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";

const oauthProviders = [];

if (process.env.AUTH_TWITTER_ID && process.env.AUTH_TWITTER_SECRET) {
  oauthProviders.push(
    Twitter({
      clientId: process.env.AUTH_TWITTER_ID,
      clientSecret: process.env.AUTH_TWITTER_SECRET,
    })
  );
}

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  oauthProviders.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
  oauthProviders.push(
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
    })
  );
}

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

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.profile.displayName,
          image: user.image,
          handle: user.profile.handle,
          verified: user.profile.verified,
          profileId: user.profile.id,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;

      if (token.id) {
        const profile = await prisma.profile.findUnique({
          where: { userId: token.id as string },
          select: { id: true, handle: true, verified: true },
        });
        if (profile) {
          token.profileId = profile.id;
          token.handle = profile.handle;
          token.verified = profile.verified;
        } else {
          delete token.profileId;
          delete token.handle;
          delete token.verified;
        }
      }

      return token;
    },
  },
});
