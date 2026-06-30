"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertCanMessage } from "@/lib/messages";
import {
  GROUP_MAX_MEMBERS,
  GROUP_MIN_MEMBERS,
  GROUP_NAME_MAX_LENGTH,
} from "@/lib/constants";

async function requireProfile() {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) throw new Error("Não autorizado");
  return profileId;
}

async function assertGroupParticipant(conversationId: string, profileId: string) {
  const row = await prisma.conversationParticipant.findUnique({
    where: { conversationId_profileId: { conversationId, profileId } },
    include: { conversation: { select: { isGroup: true } } },
  });
  if (!row?.conversation.isGroup) throw new Error("Grupo não encontrado");
  return row;
}

export async function createGroupConversation(name: string, memberIds: string[]) {
  const profileId = await requireProfile();
  const title = name.trim();
  if (!title || title.length > GROUP_NAME_MAX_LENGTH) {
    throw new Error(`Nome do grupo obrigatório (máx. ${GROUP_NAME_MAX_LENGTH} caracteres).`);
  }

  const uniqueMembers = Array.from(new Set(memberIds.filter((id) => id !== profileId)));
  if (uniqueMembers.length < GROUP_MIN_MEMBERS - 1) {
    throw new Error(`Adicione pelo menos ${GROUP_MIN_MEMBERS - 1} participante(s).`);
  }
  if (uniqueMembers.length + 1 > GROUP_MAX_MEMBERS) {
    throw new Error(`Máximo de ${GROUP_MAX_MEMBERS} participantes por grupo.`);
  }

  for (const memberId of uniqueMembers) {
    await assertCanMessage(profileId, memberId);
  }

  const conversation = await prisma.conversation.create({
    data: {
      isGroup: true,
      name: title,
      createdById: profileId,
      participants: {
        create: [{ profileId }, ...uniqueMembers.map((id) => ({ profileId: id }))],
      },
    },
  });

  revalidatePath("/messages");
  return { conversationId: conversation.id };
}

export async function addGroupMembers(conversationId: string, memberIds: string[]) {
  const profileId = await requireProfile();
  await assertGroupParticipant(conversationId, profileId);

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: { select: { profileId: true } } },
  });
  if (!conversation) throw new Error("Grupo não encontrado");

  const existing = new Set(conversation.participants.map((p) => p.profileId));
  const toAdd = Array.from(new Set(memberIds)).filter((id) => !existing.has(id));
  if (toAdd.length === 0) throw new Error("Nenhum participante novo para adicionar.");

  if (existing.size + toAdd.length > GROUP_MAX_MEMBERS) {
    throw new Error(`Máximo de ${GROUP_MAX_MEMBERS} participantes por grupo.`);
  }

  for (const memberId of toAdd) {
    await assertCanMessage(profileId, memberId);
  }

  await prisma.conversationParticipant.createMany({
    data: toAdd.map((id) => ({ conversationId, profileId: id })),
    skipDuplicates: true,
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
}

export async function leaveGroup(conversationId: string) {
  const profileId = await requireProfile();
  await assertGroupParticipant(conversationId, profileId);

  await prisma.conversationParticipant.delete({
    where: { conversationId_profileId: { conversationId, profileId } },
  });

  const remaining = await prisma.conversationParticipant.count({
    where: { conversationId },
  });

  if (remaining === 0) {
    await prisma.conversation.delete({ where: { id: conversationId } });
    revalidatePath("/messages");
    return { left: true as const };
  }

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
  return { left: true as const };
}

export async function getGroupMemberCandidates(profileId: string) {
  const following = await prisma.follow.findMany({
    where: { followerId: profileId },
    select: {
      following: {
        select: {
          id: true,
          displayName: true,
          handle: true,
          verified: true,
        },
      },
    },
    take: 50,
  });

  return following
    .map((f) => f.following)
    .filter((p) => p.verified)
    .map((p) => ({
      id: p.id,
      name: p.displayName,
      handle: p.handle,
    }));
}
