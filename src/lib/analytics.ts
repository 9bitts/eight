import { prisma } from "@/lib/prisma";

export async function recordProfileView(profileId: string, viewerId: string) {
  if (profileId === viewerId) return;

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await prisma.profileView.findFirst({
    where: {
      profileId,
      viewerId,
      createdAt: { gte: dayAgo },
    },
  });
  if (recent) return;

  await prisma.profileView.create({
    data: { profileId, viewerId },
  });
}

export async function getProfileAnalytics(profileId: string) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [views7d, views30d, scheduledCount, postCount] = await Promise.all([
    prisma.profileView.count({
      where: { profileId, createdAt: { gte: weekAgo } },
    }),
    prisma.profileView.count({
      where: { profileId, createdAt: { gte: monthAgo } },
    }),
    prisma.post.count({
      where: {
        authorId: profileId,
        scheduledAt: { gt: now },
        parentId: null,
      },
    }),
    prisma.post.count({
      where: { authorId: profileId, parentId: null, threadId: null },
    }),
  ]);

  return { views7d, views30d, scheduledCount, postCount };
}
