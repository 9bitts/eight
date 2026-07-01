"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { removeFollowsBetween } from "@/lib/relationships";
import { toggleUniqueRecord } from "@/lib/toggle-record";

async function requireProfile() {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) throw new Error("Não autorizado");
  return profileId;
}

export async function toggleBlock(targetProfileId: string) {
  const profileId = await requireProfile();
  if (profileId === targetProfileId) throw new Error("Ação inválida");

  await toggleUniqueRecord(
    () =>
      prisma.block.deleteMany({
        where: { blockerId: profileId, blockedId: targetProfileId },
      }),
    async () => {
      await removeFollowsBetween(profileId, targetProfileId);
      await prisma.block.create({
        data: { blockerId: profileId, blockedId: targetProfileId },
      });
    }
  );

  revalidatePath("/feed");
  revalidatePath("/explore");
  revalidatePath("/settings");
}

export async function toggleMute(targetProfileId: string) {
  const profileId = await requireProfile();
  if (profileId === targetProfileId) throw new Error("Ação inválida");

  await toggleUniqueRecord(
    () =>
      prisma.mute.deleteMany({
        where: { muterId: profileId, mutedId: targetProfileId },
      }),
    async () => {
      await prisma.mute.create({
        data: { muterId: profileId, mutedId: targetProfileId },
      });
    }
  );

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
