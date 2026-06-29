import { prisma } from "@/lib/prisma";
import { formatSpec, timeAgo } from "@/lib/format";
import type { FeedPost, SessionUser, Suggestion } from "@/lib/types";

const postInclude = {
  author: true,
  _count: {
    select: {
      likes: true,
      repostRecords: true,
      replies: true,
    },
  },
  likes: { select: { profileId: true } },
  repostRecords: { select: { profileId: true } },
} as const;

function mapPost(
  post: {
    id: string;
    body: string;
    createdAt: Date;
    authorId: string;
    author: {
      displayName: string;
      handle: string;
      specialty: string | null;
      registrationType: string | null;
      registrationNumber: string | null;
      location: string | null;
      verified: boolean;
    };
    _count: { likes: number; repostRecords: number; replies: number };
    likes: { profileId: string }[];
    repostRecords: { profileId: string }[];
  },
  viewerProfileId?: string
): FeedPost {
  return {
    id: post.id,
    authorId: post.authorId,
    name: post.author.displayName,
    handle: post.author.handle,
    spec: formatSpec(
      post.author.specialty,
      post.author.registrationType,
      post.author.registrationNumber
    ),
    loc: post.author.location ?? "",
    time: timeAgo(post.createdAt),
    body: post.body,
    verified: post.author.verified,
    likes: post._count.likes,
    reposts: post._count.repostRecords,
    replies: post._count.replies,
    liked: viewerProfileId
      ? post.likes.some((l) => l.profileId === viewerProfileId)
      : false,
    reposted: viewerProfileId
      ? post.repostRecords.some((r) => r.profileId === viewerProfileId)
      : false,
  };
}

export async function getSessionUser(userId: string): Promise<SessionUser | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, displayName: true, handle: true, verified: true },
  });
  if (!profile) return null;
  return {
    profileId: profile.id,
    displayName: profile.displayName,
    handle: profile.handle,
    verified: profile.verified,
  };
}

export async function getFeedPosts(
  viewerProfileId?: string,
  authorId?: string
): Promise<FeedPost[]> {
  const posts = await prisma.post.findMany({
    where: {
      parentId: null,
      ...(authorId ? { authorId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: postInclude,
  });
  return posts.map((p) => mapPost(p, viewerProfileId));
}

export async function getPostById(
  id: string,
  viewerProfileId?: string
): Promise<FeedPost | null> {
  const post = await prisma.post.findUnique({
    where: { id },
    include: postInclude,
  });
  if (!post) return null;
  return mapPost(post, viewerProfileId);
}

export async function getReplies(
  parentId: string,
  viewerProfileId?: string
): Promise<FeedPost[]> {
  const posts = await prisma.post.findMany({
    where: { parentId },
    orderBy: { createdAt: "asc" },
    include: postInclude,
  });
  return posts.map((p) => mapPost(p, viewerProfileId));
}

export async function getSuggestions(
  viewerProfileId: string
): Promise<Suggestion[]> {
  const following = await prisma.follow.findMany({
    where: { followerId: viewerProfileId },
    select: { followingId: true },
  });
  const excludeIds = [viewerProfileId, ...following.map((f) => f.followingId)];

  const profiles = await prisma.profile.findMany({
    where: { id: { notIn: excludeIds } },
    orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
    take: 5,
    select: {
      id: true,
      displayName: true,
      handle: true,
      specialty: true,
      registrationType: true,
      registrationNumber: true,
      verified: true,
    },
  });

  return profiles.map((p) => ({
    id: p.id,
    name: p.displayName,
    handle: p.handle,
    spec: formatSpec(p.specialty, p.registrationType, p.registrationNumber),
    verified: p.verified,
    following: false,
  }));
}

export async function getProfileByHandle(handle: string) {
  return prisma.profile.findUnique({
    where: { handle: handle.toLowerCase() },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: { where: { parentId: null } },
        },
      },
    },
  });
}

export async function isFollowing(followerId: string, followingId: string) {
  const row = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return !!row;
}

export async function getUnreadNotificationCount(profileId: string) {
  return prisma.notification.count({
    where: { recipientId: profileId, read: false },
  });
}

export async function searchProfiles(query: string, limit = 10) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return prisma.profile.findMany({
    where: {
      OR: [
        { handle: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
        { specialty: { contains: q, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: { verified: "desc" },
    select: {
      id: true,
      displayName: true,
      handle: true,
      specialty: true,
      registrationType: true,
      registrationNumber: true,
      verified: true,
      location: true,
    },
  });
}

export async function searchPosts(
  query: string,
  viewerProfileId?: string,
  limit = 20
) {
  const q = query.trim();
  if (!q) return [];
  const posts = await prisma.post.findMany({
    where: {
      parentId: null,
      body: { contains: q, mode: "insensitive" },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: postInclude,
  });
  return posts.map((p) => mapPost(p, viewerProfileId));
}
