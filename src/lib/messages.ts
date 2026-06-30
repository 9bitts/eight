import { prisma } from "@/lib/prisma";
import { getBlockStatus } from "@/lib/relationships";
import { timeAgo } from "@/lib/format";

export type ConversationPreview = {
  id: string;
  isGroup: boolean;
  name: string | null;
  otherId: string | null;
  otherName: string;
  otherHandle: string | null;
  otherVerified: boolean;
  participantCount: number;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unread: boolean;
};

export type ChatMessage = {
  id: string;
  body: string;
  imageUrl: string | null;
  senderId: string;
  senderName: string | null;
  createdAt: Date;
  isMine: boolean;
};

export type ConversationDetail = {
  isGroup: boolean;
  name: string | null;
  title: string;
  otherHandle: string | null;
  isCreator: boolean;
  participants: { id: string; name: string; handle: string }[];
  messages: ChatMessage[];
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
      isGroup: false,
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
    const conv = p.conversation;
    const isGroup = conv.isGroup;
    const others = conv.participants.filter((x) => x.profileId !== profileId);
    const other = others[0]?.profile;
    const last = conv.messages[0] ?? null;
    const unread =
      !!last &&
      last.senderId !== profileId &&
      (!p.lastReadAt || last.createdAt > p.lastReadAt);

    const groupTitle =
      conv.name ||
      others
        .map((x) => x.profile.displayName.split(" ")[0])
        .slice(0, 3)
        .join(", ") + (others.length > 3 ? "…" : "");

    return {
      id: p.conversationId,
      isGroup,
      name: conv.name,
      otherId: isGroup ? null : other?.id ?? null,
      otherName: isGroup ? groupTitle : other?.displayName ?? "Conversa",
      otherHandle: isGroup ? null : other?.handle ?? null,
      otherVerified: isGroup ? false : other?.verified ?? false,
      participantCount: conv.participants.length,
      lastMessage: last
        ? last.imageUrl && !last.body.trim()
          ? "📷 Foto"
          : last.body.trim() || "📷 Foto"
        : null,
      lastMessageAt: last?.createdAt ?? null,
      unread,
    };
  });
}

export async function getConversationMessages(
  conversationId: string,
  profileId: string
): Promise<ConversationDetail | null> {
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
          messages: {
            orderBy: { createdAt: "asc" },
            take: 200,
            include: {
              sender: { select: { displayName: true } },
            },
          },
        },
      },
    },
  });

  if (!participant) return null;

  const conv = participant.conversation;
  const isGroup = conv.isGroup;
  const others = conv.participants.filter((p) => p.profileId !== profileId);
  const other = others[0]?.profile;

  await prisma.conversationParticipant.update({
    where: { id: participant.id },
    data: { lastReadAt: new Date() },
  });

  const groupTitle =
    conv.name ||
    others
      .map((p) => p.profile.displayName.split(" ")[0])
      .slice(0, 3)
      .join(", ") + (others.length > 3 ? "…" : "");

  return {
    isGroup,
    name: conv.name,
    title: isGroup ? groupTitle : other?.displayName ?? "Conversa",
    otherHandle: isGroup ? null : other?.handle ?? null,
    isCreator: conv.createdById === profileId,
    participants: conv.participants.map((p) => ({
      id: p.profile.id,
      name: p.profile.displayName,
      handle: p.profile.handle,
    })),
    messages: conv.messages.map((m) => ({
      id: m.id,
      body: m.body,
      imageUrl: m.imageUrl,
      senderId: m.senderId,
      senderName: isGroup ? m.sender.displayName : null,
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
