"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_WORDS = 50;
const MAX_LENGTH = 50;

async function requireProfile() {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) throw new Error("Não autorizado");
  return profileId;
}

export async function addMutedWord(word: string) {
  const profileId = await requireProfile();
  const w = word.trim().toLowerCase();
  if (!w || w.length > MAX_LENGTH) throw new Error("Palavra inválida");

  const count = await prisma.mutedWord.count({ where: { profileId } });
  if (count >= MAX_WORDS) throw new Error(`Máximo de ${MAX_WORDS} palavras silenciadas.`);

  await prisma.mutedWord.upsert({
    where: { profileId_word: { profileId, word: w } },
    create: { profileId, word: w },
    update: {},
  });

  revalidatePath("/settings");
  revalidatePath("/feed");
}

export async function removeMutedWord(word: string) {
  const profileId = await requireProfile();
  const w = word.trim().toLowerCase();
  await prisma.mutedWord.deleteMany({ where: { profileId, word: w } });
  revalidatePath("/settings");
  revalidatePath("/feed");
}

export async function getMutedWordsForSettings() {
  const profileId = await requireProfile();
  return prisma.mutedWord.findMany({
    where: { profileId },
    orderBy: { word: "asc" },
    select: { id: true, word: true },
  });
}
