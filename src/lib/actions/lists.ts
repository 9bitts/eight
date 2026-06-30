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

export async function createList(name: string, description?: string) {
  const profileId = await requireProfile();
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) throw new Error("Nome da lista muito curto.");
  if (trimmed.length > 80) throw new Error("Nome da lista muito longo.");

  const list = await prisma.profileList.create({
    data: {
      ownerId: profileId,
      name: trimmed,
      description: description?.trim() || null,
    },
  });
  revalidatePath("/listas");
  return { id: list.id };
}

export async function deleteList(listId: string) {
  const profileId = await requireProfile();
  await prisma.profileList.deleteMany({
    where: { id: listId, ownerId: profileId },
  });
  revalidatePath("/listas");
}

export async function addToList(listId: string, targetProfileId: string) {
  const profileId = await requireProfile();
  if (profileId === targetProfileId) throw new Error("Ação inválida");

  const list = await prisma.profileList.findFirst({
    where: { id: listId, ownerId: profileId },
  });
  if (!list) throw new Error("Lista não encontrada.");

  await prisma.profileListMember.upsert({
    where: { listId_profileId: { listId, profileId: targetProfileId } },
    create: { listId, profileId: targetProfileId },
    update: {},
  });
  revalidatePath("/listas");
  revalidatePath(`/listas/${listId}`);
}

export async function removeFromList(listId: string, targetProfileId: string) {
  const profileId = await requireProfile();
  await prisma.profileListMember.deleteMany({
    where: {
      listId,
      profileId: targetProfileId,
      list: { ownerId: profileId },
    },
  });
  revalidatePath(`/listas/${listId}`);
  revalidatePath("/listas");
}

export async function updateList(
  listId: string,
  data: { name?: string; description?: string; isPublic?: boolean }
) {
  const profileId = await requireProfile();
  const list = await prisma.profileList.findFirst({
    where: { id: listId, ownerId: profileId },
  });
  if (!list) throw new Error("Lista não encontrada.");

  const patch: { name?: string; description?: string | null; isPublic?: boolean } = {};

  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (!trimmed || trimmed.length < 2) throw new Error("Nome da lista muito curto.");
    if (trimmed.length > 80) throw new Error("Nome da lista muito longo.");
    patch.name = trimmed;
  }

  if (data.description !== undefined) {
    patch.description = data.description.trim() || null;
  }

  if (data.isPublic !== undefined) {
    patch.isPublic = data.isPublic;
  }

  if (Object.keys(patch).length === 0) return;

  await prisma.profileList.update({
    where: { id: listId },
    data: patch,
  });

  if (data.isPublic === false) {
    await prisma.listFollow.deleteMany({ where: { listId } });
  }

  revalidatePath("/listas");
  revalidatePath(`/listas/${listId}`);
}

export async function toggleListMember(listId: string, targetProfileId: string) {
  const profileId = await requireProfile();
  const list = await prisma.profileList.findFirst({
    where: { id: listId, ownerId: profileId },
  });
  if (!list) throw new Error("Lista não encontrada.");

  const existing = await prisma.profileListMember.findUnique({
    where: { listId_profileId: { listId, profileId: targetProfileId } },
  });

  if (existing) {
    await prisma.profileListMember.delete({ where: { listId_profileId: { listId, profileId: targetProfileId } } });
  } else {
    await prisma.profileListMember.create({ data: { listId, profileId: targetProfileId } });
  }
  revalidatePath("/listas");
}

export async function fetchListsForTarget(targetProfileId: string) {
  const profileId = await requireProfile();
  const lists = await prisma.profileList.findMany({
    where: { ownerId: profileId },
    select: {
      id: true,
      name: true,
      members: { where: { profileId: targetProfileId }, select: { profileId: true } },
    },
    orderBy: { name: "asc" },
  });
  return lists.map((l) => ({
    id: l.id,
    name: l.name,
    member: l.members.length > 0,
  }));
}

export async function followList(listId: string) {
  const profileId = await requireProfile();
  const list = await prisma.profileList.findUnique({
    where: { id: listId },
    select: { ownerId: true, isPublic: true },
  });
  if (!list || !list.isPublic) throw new Error("Lista não encontrada ou não é pública.");
  if (list.ownerId === profileId) throw new Error("Você não pode seguir sua própria lista.");

  await prisma.listFollow.upsert({
    where: { profileId_listId: { profileId, listId } },
    create: { profileId, listId },
    update: {},
  });

  revalidatePath("/listas");
  revalidatePath(`/listas/${listId}`);
}

export async function unfollowList(listId: string) {
  const profileId = await requireProfile();
  await prisma.listFollow.deleteMany({
    where: { profileId, listId },
  });
  revalidatePath("/listas");
  revalidatePath(`/listas/${listId}`);
}

export async function toggleListFollow(listId: string) {
  const profileId = await requireProfile();
  const existing = await prisma.listFollow.findUnique({
    where: { profileId_listId: { profileId, listId } },
  });
  if (existing) {
    await unfollowList(listId);
    return { following: false };
  }
  await followList(listId);
  return { following: true };
}
