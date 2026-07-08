import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from "@/auth.config";
import { doctor8Provider } from "@/lib/auth/doctor8-provider";
import { syncDoctor8Verification } from "@/lib/auth/doctor8-verification";
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
      const p = profile as
        | { sub?: string; role?: string; email_verified?: boolean }
        | undefined;
      if (p?.role && !DOCTOR8_SSO_ROLES.has(p.role)) return false;

      // allowDangerousEmailAccountLinking (no provider) vincula/cria conta
      // automaticamente casando por e-mail. Só é seguro fazer isso quando a
      // Doctor8 garante que o e-mail foi confirmado. Se não vier confirmado,
      // só deixamos passar quando esse `sub` já está vinculado a uma conta
      // existente (a identidade já foi estabelecida antes, pelo sub — não
      // é um vínculo novo por e-mail, então não corre o risco de takeover).
      if (p?.email_verified !== true) {
        const alreadyLinked = p?.sub
          ? await prisma.account.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: "doctor8",
                  providerAccountId: p.sub,
                },
              },
            })
          : null;
        if (!alreadyLinked) return false;
      }

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
        token.sessionVersion =
          (user as { sessionVersion?: number }).sessionVersion ?? 0;
      }

      if (account?.provider === "doctor8" && profile && typeof profile === "object") {
        const p = profile as { role?: string; verified?: boolean };
        if (p.role) (token as { doctor8Role?: string }).doctor8Role = p.role;
        if (typeof p.verified === "boolean") {
          (token as { doctor8Verified?: boolean }).doctor8Verified = p.verified;
          if (token.id) {
            try {
              await syncDoctor8Verification(token.id as string, p.verified);
            } catch (err) {
              console.error("[auth] doctor8 verification sync failed:", err);
            }
          }
        }
      }

      if (trigger === "update" && session) {
        const s = session as Record<string, unknown>;
        if (s.handle !== undefined) token.handle = s.handle as string | undefined;
        if (s.verified !== undefined) token.verified = s.verified as boolean | undefined;
      }

      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              isAdmin: true,
              email: true,
              sessionVersion: true,
              profile: {
                select: {
                  id: true,
                  handle: true,
                  verified: true,
                  verificationStatus: true,
                  suspended: true,
                },
              },
            },
          });

          if (!dbUser) {
            delete token.profileId;
            delete token.handle;
            delete token.verified;
            delete token.verificationStatus;
            delete token.isAdmin;
            return token;
          }

          // Sessão emitida antes de um evento que incrementa sessionVersion
          // (ex.: reset de senha, quando ainda existia login por senha) —
          // derruba o token: some com o id pra virar "deslogado" no próximo
          // request (middleware/session).
          const tokenVersion =
            typeof token.sessionVersion === "number" ? token.sessionVersion : 0;
          if (dbUser.sessionVersion > tokenVersion) {
            delete token.id;
            delete token.sub;
            delete token.profileId;
            delete token.handle;
            delete token.verified;
            delete token.verificationStatus;
            delete token.isAdmin;
            delete token.suspended;
            return token;
          }

          const dbProfile = dbUser.profile;
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
                dbUser.isAdmin ||
                adminEmails.includes(dbUser.email?.toLowerCase() ?? "");
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
