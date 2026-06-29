import { prisma } from "@/lib/prisma";

type NotifyType = "LIKE" | "REPOST" | "FOLLOW" | "REPLY" | "MENTION" | "MESSAGE";

const PREF_FIELD: Record<NotifyType, keyof {
  notifyLike: boolean;
  notifyRepost: boolean;
  notifyFollow: boolean;
  notifyReply: boolean;
  notifyMention: boolean;
  notifyMessage: boolean;
}> = {
  LIKE: "notifyLike",
  REPOST: "notifyRepost",
  FOLLOW: "notifyFollow",
  REPLY: "notifyReply",
  MENTION: "notifyMention",
  MESSAGE: "notifyMessage",
};

export async function createNotificationIfAllowed(
  recipientId: string,
  actorId: string,
  type: NotifyType,
  postId?: string
) {
  if (recipientId === actorId) return;

  const profile = await prisma.profile.findUnique({
    where: { id: recipientId },
    select: {
      notifyLike: true,
      notifyRepost: true,
      notifyFollow: true,
      notifyReply: true,
      notifyMention: true,
      notifyMessage: true,
    },
  });
  if (!profile) return;

  const field = PREF_FIELD[type];
  if (!profile[field]) return;

  await prisma.notification.create({
    data: { recipientId, actorId, type, postId: postId ?? null },
  });
}

export type NotificationPrefs = {
  notifyLike: boolean;
  notifyRepost: boolean;
  notifyFollow: boolean;
  notifyReply: boolean;
  notifyMention: boolean;
  notifyMessage: boolean;
};

export async function getNotificationPrefs(profileId: string): Promise<NotificationPrefs> {
  const p = await prisma.profile.findUniqueOrThrow({
    where: { id: profileId },
    select: {
      notifyLike: true,
      notifyRepost: true,
      notifyFollow: true,
      notifyReply: true,
      notifyMention: true,
      notifyMessage: true,
    },
  });
  return p;
}

export async function updateNotificationPrefs(profileId: string, prefs: NotificationPrefs) {
  await prisma.profile.update({
    where: { id: profileId },
    data: prefs,
  });
}
