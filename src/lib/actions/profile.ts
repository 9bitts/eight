"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireProfile() {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) throw new Error("Não autorizado");
  return profileId;
}

export type ProfileEditInput = {
  displayName: string;
  bio?: string;
  specialty?: string;
  location?: string;
  teleconsultUrl?: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
};

export async function updateProfile(data: ProfileEditInput) {
  const profileId = await requireProfile();

  const displayName = data.displayName.trim();
  if (!displayName || displayName.length < 2) {
    throw new Error("Nome muito curto.");
  }
  if (displayName.length > 50) throw new Error("Nome muito longo.");

  const bio = data.bio?.trim() || null;
  if (bio && bio.length > 160) throw new Error("Bio muito longa.");

  await prisma.profile.update({
    where: { id: profileId },
    data: {
      displayName,
      bio,
      specialty: data.specialty?.trim() || null,
      location: data.location?.trim() || null,
      teleconsultUrl: data.teleconsultUrl?.trim() || null,
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      ...(data.bannerUrl !== undefined ? { bannerUrl: data.bannerUrl } : {}),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/feed");
}

export async function getProfileForEdit() {
  const profileId = await requireProfile();
  return prisma.profile.findUnique({
    where: { id: profileId },
    select: {
      displayName: true,
      bio: true,
      specialty: true,
      location: true,
      teleconsultUrl: true,
      avatarUrl: true,
      bannerUrl: true,
      handle: true,
    },
  });
}
