import { prisma } from "@/lib/prisma";
import { formatSpec, timeAgo, formatCount } from "@/lib/format";
import { publishedWhere } from "@/lib/post-utils";
import type { FeedPost, FeedTab, SessionUser, Suggestion, Trend } from "@/lib/types";

const postInclude = {
  author: true,
  poll: {
    include: {
      options: { orderBy: { sortOrder: "asc" as const }, include: { _count: { select: { votes: true } } } },
      votes: { select: { profileId: true, optionId: true } },
    },
  },
  _count: {
    select: { likes: true, repostRecords: true, replies: true },
  },
  likes: { select: { profileId: true } },
  repostRecords: { select: { profileId: true } },
} as const;

type RawPost = {
  id: string;
  body: string;
  createdAt: Date;
  authorId: string;
  images: string[];
  videoUrl: string | null;
  gifUrl: string | null;
  scheduledAt: Date | null;
  editedAt: Date | null;
  threadId: string | null;
  threadOrder: number;
  linkUrl: string | null;
  linkTitle: string | null;
  linkDesc: string | null;
  linkImage: string | null;
  author: {
    displayName: string;
    handle: string;
    specialty: string | null;
    registrationType: string | null;
    registrationNumber: string | null;
    location: string | null;
    verified: boolean;
    pinnedPostId: string | null;
  };
  poll: {
    id: string;
    endsAt: Date;
    options: { id: string; text: string; _count: { votes: number } }[];
    votes: { profileId: string; optionId: string }[];
  } | null;
  _count: { likes: number; repostRecords: number; replies: number };
  likes: { profileId: string }[];
  repostRecords: { profileId: string }[];
};

function mapPoll(
  poll: RawPost["poll"],
  viewerProfileId?: string
): FeedPost["poll"] {
  if (!poll) return null;
  const now = new Date();
  const ended = poll.endsAt < now;
  const totalVotes = poll.options.reduce((s, o) => s + o._count.votes, 0);
  const userVote = viewerProfileId
    ? poll.votes.find((v) => v.profileId === viewerProfileId)
    : undefined;

  return {
    id: poll.id,
    endsAt: poll.endsAt.toISOString(),
    ended,
    totalVotes,
    userVoted: !!userVote,
    options: poll.options.map((o) => ({
      id: o.id,
      text: o.text,
      votes: o._count.votes,
      percent: totalVotes ? Math.round((o._count.votes / totalVotes) * 100) : 0,
      voted: userVote?.optionId === o.id,
    })),
  };
}

function mapPost(post: RawPost, viewerProfileId?: string): FeedPost {
  const scheduled = post.scheduledAt != null && post.scheduledAt > new Date();
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
    time: scheduled && post.scheduledAt
      ? `agendado · ${post.scheduledAt.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`
      : timeAgo(post.createdAt),
    body: post.body,
    verified: post.author.verified,
    images: post.images,
    videoUrl: post.videoUrl,
    gifUrl: post.gifUrl,
    edited: !!post.editedAt,
    scheduled,
    scheduledAt: post.scheduledAt?.toISOString() ?? null,
    isPinned: post.author.pinnedPostId === post.id,
    threadId: post.threadId,
    threadOrder: post.threadOrder,
    likes: post._count.likes,
    reposts: post._count.repostRecords,
    replies: post._count.replies,
    liked: viewerProfileId
      ? post.likes.some((l) => l.profileId === viewerProfileId)
      : false,
    reposted: viewerProfileId
      ? post.repostRecords.some((r) => r.profileId === viewerProfileId)
      : false,
    linkPreview: post.linkUrl
      ? {
          url: post.linkUrl,
          title: post.linkTitle,
          description: post.linkDesc,
          image: post.linkImage,
        }
      : null,
    poll: mapPoll(post.poll, viewerProfileId),
    isOwner: viewerProfileId === post.authorId,
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
  viewerProfileId: string,
  tab: FeedTab = "forYou",
  authorId?: string
): Promise<FeedPost[]> {
  let authorWhere: { authorId?: string | { in: string[] } } = {};

  if (authorId) {
    authorWhere = { authorId };
  } else if (tab === "following") {
    const following = await prisma.follow.findMany({
      where: { followerId: viewerProfileId },
      select: { followingId: true },
    });
    const ids = [viewerProfileId, ...following.map((f) => f.followingId)];
    authorWhere = { authorId: { in: ids } };
  }

  const posts = await prisma.post.findMany({
    where: {
      parentId: null,
      threadId: null,
      ...publishedWhere(),
      ...authorWhere,
    },
    orderBy:
      tab === "forYou" && !authorId
        ? [{ author: { verified: "desc" } }, { createdAt: "desc" }]
        : { createdAt: "desc" },
    take: 50,
    include: postInclude,
  });

  const mapped = posts.map((p) => mapPost(p as RawPost, viewerProfileId));

  if (authorId) {
    const profile = await prisma.profile.findUnique({
      where: { id: authorId },
      select: { pinnedPostId: true },
    });
    if (profile?.pinnedPostId) {
      const pinIdx = mapped.findIndex((p) => p.id === profile.pinnedPostId);
      if (pinIdx > 0) {
        const [pin] = mapped.splice(pinIdx, 1);
        mapped.unshift(pin);
      }
    }
  }

  return mapped;
}

export async function getThreadPosts(
  threadId: string,
  viewerProfileId?: string
): Promise<FeedPost[]> {
  const root = await prisma.post.findUnique({
    where: { id: threadId },
    include: postInclude,
  });
  if (!root) return [];

  const parts = await prisma.post.findMany({
    where: { threadId },
    orderBy: { threadOrder: "asc" },
    include: postInclude,
  });

  return [root, ...parts].map((p) => mapPost(p as RawPost, viewerProfileId));
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
  return mapPost(post as RawPost, viewerProfileId);
}

export async function getReplies(
  parentId: string,
  viewerProfileId?: string
): Promise<FeedPost[]> {
  const posts = await prisma.post.findMany({
    where: { parentId, ...publishedWhere() },
    orderBy: { createdAt: "asc" },
    include: postInclude,
  });
  return posts.map((p) => mapPost(p as RawPost, viewerProfileId));
}

export async function getSuggestions(viewerProfileId: string): Promise<Suggestion[]> {
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

export async function getTrendingHashtags(limit = 4): Promise<Trend[]> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const rows = await prisma.postHashtag.groupBy({
    by: ["hashtagId"],
    where: {
      post: {
        createdAt: { gte: weekAgo },
        parentId: null,
        ...publishedWhere(),
      },
    },
    _count: { hashtagId: true },
    orderBy: { _count: { hashtagId: "desc" } },
    take: limit,
  });

  if (rows.length === 0) {
    return [
      { tag: "Telemedicina", count: 0 },
      { tag: "SaúdeDigital", count: 0 },
    ];
  }

  const tags = await prisma.hashtag.findMany({
    where: { id: { in: rows.map((r) => r.hashtagId) } },
  });
  const tagMap = Object.fromEntries(tags.map((t) => [t.id, t.tag]));

  return rows.map((r) => ({
    tag: tagMap[r.hashtagId] ?? "?",
    count: r._count.hashtagId,
  }));
}

export async function getPostsByHashtag(
  tag: string,
  viewerProfileId?: string
): Promise<FeedPost[]> {
  const hashtag = await prisma.hashtag.findUnique({
    where: { tag: tag.toLowerCase() },
  });
  if (!hashtag) return [];

  const links = await prisma.postHashtag.findMany({
    where: { hashtagId: hashtag.id },
    select: { postId: true },
    take: 50,
  });

  const posts = await prisma.post.findMany({
    where: {
      id: { in: links.map((l) => l.postId) },
      parentId: null,
      ...publishedWhere(),
    },
    orderBy: { createdAt: "desc" },
    include: postInclude,
  });

  return posts.map((p) => mapPost(p as RawPost, viewerProfileId));
}

export async function getProfileByHandle(handle: string) {
  return prisma.profile.findUnique({
    where: { handle: handle.toLowerCase() },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: { where: { parentId: null, threadId: null } },
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
      ...publishedWhere(),
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: postInclude,
  });
  return posts.map((p) => mapPost(p as RawPost, viewerProfileId));
}

export { formatCount };
