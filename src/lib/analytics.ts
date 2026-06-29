import { prisma } from "@/lib/prisma";
import { formatSpec } from "@/lib/format";

export type ProfileViewer = {
  id: string;
  displayName: string;
  handle: string;
  spec: string;
  verified: boolean;
  viewedAt: Date;
};

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

export async function getProfileViewers(profileId: string): Promise<ProfileViewer[]> {
  const rows = await prisma.profileView.findMany({
    where: { profileId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      viewer: {
        select: {
          id: true,
          displayName: true,
          handle: true,
          specialty: true,
          registrationType: true,
          registrationNumber: true,
          verified: true,
        },
      },
    },
  });

  const seen = new Set<string>();
  const viewers: ProfileViewer[] = [];

  for (const row of rows) {
    if (seen.has(row.viewerId)) continue;
    seen.add(row.viewerId);
    viewers.push({
      id: row.viewer.id,
      displayName: row.viewer.displayName,
      handle: row.viewer.handle,
      spec: formatSpec(
        row.viewer.specialty,
        row.viewer.registrationType,
        row.viewer.registrationNumber
      ),
      verified: row.viewer.verified,
      viewedAt: row.createdAt,
    });
    if (viewers.length >= 50) break;
  }

  return viewers;
}
