import { prisma } from "@/lib/prisma";
import { getBlockStatus } from "@/lib/relationships";

export async function hasMutualFollow(a: string, b: string) {
  const [ab, ba] = await Promise.all([
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: a, followingId: b } },
    }),
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: b, followingId: a } },
    }),
  ]);
  return !!(ab && ba);
}

export async function canOpenDirectConversation(senderId: string, recipientId: string) {
  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { participants: { some: { profileId: senderId } } },
        { participants: { some: { profileId: recipientId } } },
      ],
    },
  });
  if (existing) return true;

  if (await hasMutualFollow(senderId, recipientId)) return true;

  const accepted = await prisma.messageRequest.findFirst({
    where: {
      OR: [
        { fromId: senderId, toId: recipientId, status: "ACCEPTED" },
        { fromId: recipientId, toId: senderId, status: "ACCEPTED" },
      ],
    },
  });
  return !!accepted;
}

export type MessageRequestPreview = {
  id: string;
  fromId: string;
  fromName: string;
  fromHandle: string;
  fromVerified: boolean;
  body: string;
  createdAt: Date;
};

export async function getPendingMessageRequests(
  profileId: string
): Promise<MessageRequestPreview[]> {
  const rows = await prisma.messageRequest.findMany({
    where: { toId: profileId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      from: {
        select: { id: true, displayName: true, handle: true, verified: true },
      },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    fromId: r.from.id,
    fromName: r.from.displayName,
    fromHandle: r.from.handle,
    fromVerified: r.from.verified,
    body: r.body,
    createdAt: r.createdAt,
  }));
}

export async function getOutgoingPendingRequest(
  fromId: string,
  toId: string
) {
  return prisma.messageRequest.findUnique({
    where: { fromId_toId: { fromId, toId } },
    select: { id: true, status: true },
  });
}
