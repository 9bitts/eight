import { prisma } from "@/lib/prisma";

export type NotificationPrefs = {
  notifyLike: boolean;
  notifyRepost: boolean;
  notifyFollow: boolean;
  notifyReply: boolean;
  notifyMention: boolean;
  notifyMessage: boolean;
  notifyEmail: boolean;
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
      notifyEmail: true,
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

export async function countPushSubscriptions(profileId: string) {
  return prisma.pushSubscription.count({ where: { profileId } });
}
