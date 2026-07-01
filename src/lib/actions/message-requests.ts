"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertCanMessage, findOrCreateConversation } from "@/lib/messages";
import { canOpenDirectConversation } from "@/lib/message-requests";
import { createNotificationIfAllowed } from "@/lib/notifications-server";
import { detectPII } from "@/lib/pii-detector";
import { MESSAGE_REQUEST_MAX_LENGTH } from "@/lib/constants";

async function requireProfile() {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) throw new Error("Não autorizado");
  return profileId;
}

export async function tryStartConversation(targetProfileId: string) {
  const profileId = await requireProfile();
  await assertCanMessage(profileId, targetProfileId);

  const open = await canOpenDirectConversation(profileId, targetProfileId);
  if (!open) {
    const pending = await prisma.messageRequest.findUnique({
      where: { fromId_toId: { fromId: profileId, toId: targetProfileId } },
    });
    if (pending?.status === "PENDING") {
      return { needsRequest: true as const, pending: true as const };
    }
    if (pending?.status === "REJECTED") {
      throw new Error("Seu pedido de mensagem foi recusado.");
    }
    return { needsRequest: true as const, pending: false as const };
  }

  const conversationId = await findOrCreateConversation(profileId, targetProfileId);
  return { conversationId };
}

export async function sendMessageRequest(targetProfileId: string, body: string) {
  const profileId = await requireProfile();
  const text = body.trim();
  if (!text) throw new Error("Escreva uma mensagem de apresentação.");
  const pii = detectPII(text);
  if (pii.blocked) throw new Error(pii.reason ?? "Remova dados identificáveis da mensagem.");
  if (text.length > MESSAGE_REQUEST_MAX_LENGTH) {
    throw new Error(`Escreva uma mensagem de até ${MESSAGE_REQUEST_MAX_LENGTH} caracteres.`);
  }

  await assertCanMessage(profileId, targetProfileId);

  const open = await canOpenDirectConversation(profileId, targetProfileId);
  if (open) {
    const conversationId = await findOrCreateConversation(profileId, targetProfileId);
    return { conversationId };
  }

  await prisma.messageRequest.upsert({
    where: { fromId_toId: { fromId: profileId, toId: targetProfileId } },
    create: { fromId: profileId, toId: targetProfileId, body: text, status: "PENDING" },
    update: { body: text, status: "PENDING", respondedAt: null },
  });

  await createNotificationIfAllowed(targetProfileId, profileId, "MESSAGE");

  revalidatePath("/messages");
  return { sent: true as const };
}

export async function acceptMessageRequest(requestId: string) {
  const profileId = await requireProfile();

  const req = await prisma.messageRequest.findUnique({ where: { id: requestId } });
  if (!req || req.toId !== profileId || req.status !== "PENDING") {
    throw new Error("Pedido não encontrado.");
  }

  await assertCanMessage(req.fromId, profileId);

  await prisma.messageRequest.update({
    where: { id: requestId },
    data: { status: "ACCEPTED", respondedAt: new Date() },
  });

  const conversationId = await findOrCreateConversation(req.fromId, profileId);

  await prisma.directMessage.create({
    data: {
      conversationId,
      senderId: req.fromId,
      body: req.body,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  revalidatePath("/messages");
  return { conversationId };
}

export async function rejectMessageRequest(requestId: string) {
  const profileId = await requireProfile();

  const req = await prisma.messageRequest.findUnique({ where: { id: requestId } });
  if (!req || req.toId !== profileId || req.status !== "PENDING") {
    throw new Error("Pedido não encontrado.");
  }

  await prisma.messageRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", respondedAt: new Date() },
  });

  revalidatePath("/messages");
}
