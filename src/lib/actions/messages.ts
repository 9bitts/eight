"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  assertCanMessage,
} from "@/lib/messages";
import { rateLimit } from "@/lib/rate-limit";
import { createNotificationIfAllowed } from "@/lib/notifications-server";

async function requireProfile() {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) throw new Error("Não autorizado");
  return profileId;
}

export async function startConversation(targetProfileId: string) {
  const { tryStartConversation } = await import("@/lib/actions/message-requests");
  return tryStartConversation(targetProfileId);
}

export async function sendDirectMessage(conversationId: string, body: string) {
  const profileId = await requireProfile();
  const text = body.trim();
  if (!text) throw new Error("Mensagem vazia");
  if (text.length > 2000) throw new Error("Máximo 2000 caracteres");

  const limited = rateLimit(`dm:${profileId}`, 40, 60_000);
  if (!limited.ok) throw new Error(`Aguarde ${limited.retryAfterSec}s.`);

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_profileId: { conversationId, profileId } },
    include: {
      conversation: { include: { participants: true } },
    },
  });
  if (!participant) throw new Error("Conversa não encontrada");

  const other = participant.conversation.participants.find(
    (p) => p.profileId !== profileId
  );
  if (!other) throw new Error("Conversa inválida");

  await assertCanMessage(profileId, other.profileId);

  const message = await prisma.directMessage.create({
    data: {
      conversationId,
      senderId: profileId,
      body: text,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  await prisma.conversationParticipant.update({
    where: { id: participant.id },
    data: { lastReadAt: new Date() },
  });

  await createNotificationIfAllowed(other.profileId, profileId, "MESSAGE");

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
  return { id: message.id };
}
