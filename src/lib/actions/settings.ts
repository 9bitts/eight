"use server";

import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteUserAccount, exportUserData } from "@/lib/lgpd";
import { createTotpSecret, totpKeyUri, verifyTotp } from "@/lib/totp";
import { decrypt, encrypt } from "@/lib/crypto";
import type { Locale } from "@/lib/i18n";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autorizado");
  return session.user.id;
}

export async function updateLocale(locale: Locale) {
  const userId = await requireUserId();
  await prisma.user.update({ where: { id: userId }, data: { locale } });
  revalidatePath("/settings");
  revalidatePath("/feed");
}

export async function setup2FA() {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) throw new Error("E-mail não encontrado");
  if (user.totpEnabled) throw new Error("2FA já está ativo.");

  const secret = createTotpSecret();
  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: encrypt(secret) },
  });

  const otpauth = totpKeyUri(user.email, secret);
  return { secret, otpauth };
}

export async function confirm2FA(code: string) {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.totpSecret) throw new Error("Configure o 2FA primeiro.");
  if (!verifyTotp(code, decrypt(user.totpSecret))) {
    throw new Error("Código inválido.");
  }
  await prisma.user.update({
    where: { id: userId },
    data: { totpEnabled: true },
  });
  revalidatePath("/settings");
}

export async function disable2FA(code: string) {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.totpSecret || !user.totpEnabled) throw new Error("2FA não está ativo.");
  if (!verifyTotp(code, decrypt(user.totpSecret))) {
    throw new Error("Código inválido.");
  }
  await prisma.user.update({
    where: { id: userId },
    data: { totpEnabled: false, totpSecret: null },
  });
  revalidatePath("/settings");
}

export async function deleteAccount(password: string) {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuário não encontrado");

  if (user.passwordHash) {
    const bcrypt = await import("bcryptjs");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error("Senha incorreta.");
  }

  await deleteUserAccount(userId);
  await signOut({ redirect: false });
}

export async function getExportData() {
  const userId = await requireUserId();
  return exportUserData(userId);
}
