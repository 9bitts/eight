import { prisma } from "@/lib/prisma";

/**
 * Sincroniza o status de verificação profissional vindo da Doctor8 (SSO).
 *
 * Regra de segurança: só promove ou rebaixa perfis cuja verificação já veio
 * da própria Doctor8 (verifiedViaDoctor8=true), ou promove perfis ainda não
 * verificados por ninguém. Nunca rebaixa uma verificação feita manualmente
 * pela equipe da eight (upload de documento + aprovação de admin) — essas
 * continuam com verifiedViaDoctor8=false e ficam fora do alcance deste sync.
 */
export async function syncDoctor8Verification(
  userId: string,
  doctor8Verified: boolean
): Promise<void> {
  if (doctor8Verified) {
    await prisma.profile.updateMany({
      where: { userId },
      data: {
        verified: true,
        verificationStatus: "VERIFIED",
        verifiedAt: new Date(),
        verifiedViaDoctor8: true,
      },
    });
    return;
  }

  await prisma.profile.updateMany({
    where: { userId, verifiedViaDoctor8: true },
    data: {
      verified: false,
      verificationStatus: "PENDING",
      verifiedAt: null,
    },
  });
}
