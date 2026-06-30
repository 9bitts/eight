import { prisma } from "@/lib/prisma";
import { formatSpec } from "@/lib/format";
import type { ConnectionProfile } from "@/lib/types";

export async function getBlockedProfileIds(viewerProfileId: string): Promise<string[]> {
  const rows = await prisma.block.findMany({
    where: {
      OR: [{ blockerId: viewerProfileId }, { blockedId: viewerProfileId }],
    },
    select: { blockerId: true, blockedId: true },
  });

  const ids = new Set<string>();
  for (const row of rows) {
    if (row.blockerId === viewerProfileId) ids.add(row.blockedId);
    if (row.blockedId === viewerProfileId) ids.add(row.blockerId);
  }
  return Array.from(ids);
}

export async function getMutedProfileIds(viewerProfileId: string): Promise<string[]> {
  const rows = await prisma.mute.findMany({
    where: { muterId: viewerProfileId },
    select: { mutedId: true },
  });
  return rows.map((r) => r.mutedId);
}

export async function getBlockStatus(viewerProfileId: string, targetProfileId: string) {
  if (viewerProfileId === targetProfileId) {
    return { blockedByViewer: false, blockedByTarget: false, isBlocked: false };
  }

  const [blockedByViewer, blockedByTarget] = await Promise.all([
    prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: viewerProfileId, blockedId: targetProfileId } },
    }),
    prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: targetProfileId, blockedId: viewerProfileId } },
    }),
  ]);

  return {
    blockedByViewer: !!blockedByViewer,
    blockedByTarget: !!blockedByTarget,
    isBlocked: !!blockedByViewer || !!blockedByTarget,
  };
}

export async function isMuted(viewerProfileId: string, targetProfileId: string) {
  const row = await prisma.mute.findUnique({
    where: { muterId_mutedId: { muterId: viewerProfileId, mutedId: targetProfileId } },
  });
  return !!row;
}

export async function mapConnections(
  profiles: {
    id: string;
    displayName: string;
    handle: string;
    specialty: string | null;
    registrationType: string | null;
    registrationNumber: string | null;
    verified: boolean;
  }[],
  viewerProfileId: string
): Promise<ConnectionProfile[]> {
  if (profiles.length === 0) return [];

  const ids = profiles.map((p) => p.id);
  const [following, followers] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: viewerProfileId, followingId: { in: ids } },
      select: { followingId: true },
    }),
    prisma.follow.findMany({
      where: { followerId: { in: ids }, followingId: viewerProfileId },
      select: { followerId: true },
    }),
  ]);

  const followingSet = new Set(following.map((f) => f.followingId));
  const followersSet = new Set(followers.map((f) => f.followerId));

  return profiles.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    handle: p.handle,
    spec: formatSpec(p.specialty, p.registrationType, p.registrationNumber),
    verified: p.verified,
    following: followingSet.has(p.id),
    followsYou: followersSet.has(p.id),
  }));
}

export async function getFollowersList(
  profileId: string,
  viewerProfileId: string
): Promise<ConnectionProfile[]> {
  const hiddenIds = await getBlockedProfileIds(viewerProfileId);

  const rows = await prisma.follow.findMany({
    where: {
      followingId: profileId,
      followerId: hiddenIds.length ? { notIn: hiddenIds } : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      follower: {
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

  return mapConnections(
    rows.map((r) => r.follower),
    viewerProfileId
  );
}

export async function getFollowingList(
  profileId: string,
  viewerProfileId: string
): Promise<ConnectionProfile[]> {
  const hiddenIds = await getBlockedProfileIds(viewerProfileId);

  const rows = await prisma.follow.findMany({
    where: {
      followerId: profileId,
      followingId: hiddenIds.length ? { notIn: hiddenIds } : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      following: {
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

  return mapConnections(
    rows.map((r) => r.following),
    viewerProfileId
  );
}

export async function getBlockedUsers(viewerProfileId: string): Promise<ConnectionProfile[]> {
  const rows = await prisma.block.findMany({
    where: { blockerId: viewerProfileId },
    orderBy: { createdAt: "desc" },
    include: {
      blocked: {
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

  return mapConnections(
    rows.map((r) => r.blocked),
    viewerProfileId
  );
}

export async function getMutedUsers(viewerProfileId: string): Promise<ConnectionProfile[]> {
  const rows = await prisma.mute.findMany({
    where: { muterId: viewerProfileId },
    orderBy: { createdAt: "desc" },
    include: {
      muted: {
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

  return mapConnections(
    rows.map((r) => r.muted),
    viewerProfileId
  );
}

export async function removeFollowsBetween(a: string, b: string) {
  await prisma.follow.deleteMany({
    where: {
      OR: [
        { followerId: a, followingId: b },
        { followerId: b, followingId: a },
      ],
    },
  });
}

const profileSelect = {
  id: true,
  displayName: true,
  handle: true,
  specialty: true,
  registrationType: true,
  registrationNumber: true,
  verified: true,
} as const;

export async function getPostLikers(
  postId: string,
  viewerProfileId: string
): Promise<ConnectionProfile[]> {
  const hiddenIds = await getBlockedProfileIds(viewerProfileId);

  const rows = await prisma.like.findMany({
    where: {
      postId,
      profileId: hiddenIds.length ? { notIn: hiddenIds } : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { profile: { select: profileSelect } },
  });

  return mapConnections(
    rows.map((r) => r.profile),
    viewerProfileId
  );
}

export async function getPostReposters(
  postId: string,
  viewerProfileId: string
): Promise<ConnectionProfile[]> {
  const hiddenIds = await getBlockedProfileIds(viewerProfileId);

  const rows = await prisma.repost.findMany({
    where: {
      postId,
      profileId: hiddenIds.length ? { notIn: hiddenIds } : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { profile: { select: profileSelect } },
  });

  return mapConnections(
    rows.map((r) => r.profile),
    viewerProfileId
  );
}
