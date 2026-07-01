import { generateSecret, generateURI, verifySync } from "otplib";
import { prisma } from "@/lib/prisma";

const ISSUER = "eight Doctor8";

export function createTotpSecret(): string {
  return generateSecret();
}

export function totpKeyUri(email: string, secret: string): string {
  return generateURI({ issuer: ISSUER, label: email, secret });
}

export function verifyTotp(token: string, secret: string): boolean {
  const result = verifySync({ secret, token: token.trim() });
  return result.valid;
}

export async function verifyAndConsumeTotp(
  userId: string,
  token: string,
  secret: string
): Promise<boolean> {
  const normalized = token.trim();
  if (!verifyTotp(normalized, secret)) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpLastUsed: true },
  });
  if (user?.totpLastUsed === normalized) return false;

  await prisma.user.update({
    where: { id: userId },
    data: { totpLastUsed: normalized },
  });
  return true;
}
