"use server";

import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteUserAccount, exportUserData } from "@/lib/lgpd";
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
