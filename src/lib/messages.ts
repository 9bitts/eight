import { prisma } from "@/lib/prisma";
import { getBlockStatus } from "@/lib/relationships";
import { timeAgo } from "@/lib/format";

export type ConversationPreview = {
  id: string;
  otherId: string;
  otherName: string;
  otherHandle: string;
  otherVerified: boolean;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unread: boolean;
};

export type ChatMessage = {
  id: string;
  body: string;
  senderId: string;
  createdAt: Date;
  isMine: boolean;
};

export async function assertCanMessage(senderId: string, recipientId: string) {
  if (senderId === recipientId) throw new Error("Ação inválida");

  const [sender, recipient, block] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: senderId },
      select: { verified: true },
    }),
    prisma.profile.findUnique({
      where: { id: recipientId },
      select: { verified: true },
    }),
    getBlockStatus(senderId, recipientId),
  ]);

  if (!sender?.verified) {
    throw new Error("Mensagens diretas são exclusivas para profissionais verificados.");
  }
  if (!recipient?.verified) {
    throw new Error("Este profissional ainda não possui selo verificado.");
  }
  if (block.isBlocked) {
    throw new Error("Não é possível enviar mensagem para este perfil.");
  }
}

export async function findOrCreateConversation(
  profileId1: string,
  profileId2: string
) {
  const candidates = await prisma.conversation.findMany({
    where: {
      AND: [
        { participants: { some: { profileId: profileId1 } } },
        { participants: { some: { profileId: profileId2 } } },
      ],
    },
    include: { participants: true },
  });

  const existing = candidates.find((c) => c.participants.length === 2);
  if (existing) return existing.id;

  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ profileId: profileId1 }, { profileId: profileId2 }],
      },
    },
  });

  return conversation.id;
}

export async function getConversationPreviews(
  profileId: string
): Promise<ConversationPreview[]> {
  const participations = await prisma.conversationParticipant.findMany({
    where: { profileId },
    include: {
      conversation: {
        include: {
          participants: {
            include: {
              profile: {
                select: {
                  id: true,
                  displayName: true,
                  handle: true,
                  verified: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
  });

  return participations.map((p) => {
    const other = p.conversation.participants.find((x) => x.profileId !== profileId)!;
    const last = p.conversation.messages[0] ?? null;
    const unread =
      !!last &&
      last.senderId !== profileId &&
      (!p.lastReadAt || last.createdAt > p.lastReadAt);

    return {
      id: p.conversationId,
      otherId: other.profile.id,
      otherName: other.profile.displayName,
      otherHandle: other.profile.handle,
      otherVerified: other.profile.verified,
      lastMessage: last?.body ?? null,
      lastMessageAt: last?.createdAt ?? null,
      unread,
    };
  });
}

export async function getConversationMessages(
  conversationId: string,
  profileId: string
): Promise<{ messages: ChatMessage[]; otherName: string; otherHandle: string } | null> {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_profileId: { conversationId, profileId } },
    include: {
      conversation: {
        include: {
          participants: {
            include: {
              profile: { select: { id: true, displayName: true, handle: true } },
            },
          },
          messages: { orderBy: { createdAt: "asc" }, take: 200 },
        },
      },
    },
  });

  if (!participant) return null;

  const other = participant.conversation.participants.find((p) => p.profileId !== profileId)!;

  await prisma.conversationParticipant.update({
    where: { id: participant.id },
    data: { lastReadAt: new Date() },
  });

  return {
    otherName: other.profile.displayName,
    otherHandle: other.profile.handle,
    messages: participant.conversation.messages.map((m) => ({
      id: m.id,
      body: m.body,
      senderId: m.senderId,
      createdAt: m.createdAt,
      isMine: m.senderId === profileId,
    })),
  };
}

export function formatMessageTime(date: Date): string {
  return timeAgo(date);
}

export async function getUnreadMessageCount(profileId: string): Promise<number> {
  const participations = await prisma.conversationParticipant.findMany({
    where: { profileId },
    include: {
      conversation: {
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  let count = 0;
  for (const p of participations) {
    const last = p.conversation.messages[0];
    if (
      last &&
      last.senderId !== profileId &&
      (!p.lastReadAt || last.createdAt > p.lastReadAt)
    ) {
      count++;
    }
  }
  return count;
}
