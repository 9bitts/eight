"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { removeFollowsBetween } from "@/lib/relationships";

async function requireProfile() {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) throw new Error("Não autorizado");
  return profileId;
}

export async function toggleBlock(targetProfileId: string) {
  const profileId = await requireProfile();
  if (profileId === targetProfileId) throw new Error("Ação inválida");

  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: profileId, blockedId: targetProfileId } },
  });

  if (existing) {
    await prisma.block.delete({ where: { id: existing.id } });
  } else {
    await removeFollowsBetween(profileId, targetProfileId);
    await prisma.block.create({
      data: { blockerId: profileId, blockedId: targetProfileId },
    });
  }

  revalidatePath("/feed");
  revalidatePath("/explore");
  revalidatePath("/settings");
}

export async function toggleMute(targetProfileId: string) {
  const profileId = await requireProfile();
  if (profileId === targetProfileId) throw new Error("Ação inválida");

  const existing = await prisma.mute.findUnique({
    where: { muterId_mutedId: { muterId: profileId, mutedId: targetProfileId } },
  });

  if (existing) {
    await prisma.mute.delete({ where: { id: existing.id } });
  } else {
    await prisma.mute.create({
      data: { muterId: profileId, mutedId: targetProfileId },
    });
  }

  revalidatePath("/feed");
  revalidatePath("/settings");
}

export async function unblockUser(targetProfileId: string) {
  const profileId = await requireProfile();
  await prisma.block.deleteMany({
    where: { blockerId: profileId, blockedId: targetProfileId },
  });
  revalidatePath("/settings");
  revalidatePath("/feed");
}

export async function unmuteUser(targetProfileId: string) {
  const profileId = await requireProfile();
  await prisma.mute.deleteMany({
    where: { muterId: profileId, mutedId: targetProfileId },
  });
  revalidatePath("/settings");
  revalidatePath("/feed");
}
