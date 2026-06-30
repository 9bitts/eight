import { prisma } from "@/lib/prisma";
import { formatSpec, timeAgo, formatCount } from "@/lib/format";
import { publishedWhere } from "@/lib/post-filters";
import { publishDueScheduledPosts } from "@/lib/scheduled-posts";
import { getBlockedProfileIds, getMutedProfileIds } from "@/lib/relationships";
import { filterPostsByMutedWords, getMutedWords } from "@/lib/muted-words";
import { canViewListPosts } from "@/lib/lists";
import type { FeedPost, FeedTab, SessionUser, Suggestion, Trend } from "@/lib/types";

const postInclude = {
  author: {
    select: {
      displayName: true,
      handle: true,
      specialty: true,
      registrationType: true,
      registrationNumber: true,
      registrationCountry: true,
      location: true,
      verified: true,
      pinnedPostId: true,
      avatarUrl: true,
    },
  },
  poll: {
    include: {
      options: { orderBy: { sortOrder: "asc" as const }, include: { _count: { select: { votes: true } } } },
      votes: { select: { profileId: true, optionId: true } },
    },
  },
  _count: {
    select: { likes: true, repostRecords: true, replies: true, views: true, edits: true },
  },
  likes: { select: { profileId: true } },
  repostRecords: { select: { profileId: true } },
  repostOf: {
    include: {
      author: {
        select: {
          displayName: true,
          handle: true,
          verified: true,
        },
      },
    },
  },
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
  isClinicalCase: boolean;
  caseTags: string[];
  caseSpecialty: string | null;
  author: {
    displayName: string;
    handle: string;
    specialty: string | null;
    registrationType: string | null;
    registrationNumber: string | null;
    registrationCountry: string | null;
    location: string | null;
    verified: boolean;
    pinnedPostId: string | null;
    avatarUrl: string | null;
  };
  poll: {
    id: string;
    endsAt: Date;
    options: { id: string; text: string; _count: { votes: number } }[];
    votes: { profileId: string; optionId: string }[];
  } | null;
  _count: { likes: number; repostRecords: number; replies: number; views: number; edits: number };
  likes: { profileId: string }[];
  repostRecords: { profileId: string }[];
  repostOf: {
    id: string;
    body: string;
    images: string[];
    videoUrl: string | null;
    author: { displayName: string; handle: string; verified: boolean };
  } | null;
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
    avatarUrl: post.author.avatarUrl,
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
    editCount: post._count.edits,
    scheduled,
    scheduledAt: post.scheduledAt?.toISOString() ?? null,
    isPinned: post.author.pinnedPostId === post.id,
    threadId: post.threadId,
    threadOrder: post.threadOrder,
    likes: post._count.likes,
    reposts: post._count.repostRecords,
    replies: post._count.replies,
    views: post._count.views,
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
    isClinicalCase: post.isClinicalCase,
    caseTags: post.caseTags,
    caseSpecialty: post.caseSpecialty,
    quotedPost: post.repostOf
      ? {
          id: post.repostOf.id,
          name: post.repostOf.author.displayName,
          handle: post.repostOf.author.handle,
          body: post.repostOf.body,
          verified: post.repostOf.author.verified,
          images: post.repostOf.images,
          videoUrl: post.repostOf.videoUrl,
        }
      : null,
    repostedBy: null,
    createdAt: post.createdAt.toISOString(),
    saved: false,
  };
}

async function enrichSaved(posts: FeedPost[], profileId?: string) {
  if (!profileId || posts.length === 0) return posts;
  const ids = posts.map((p) => p.id);
  const rows = await prisma.bookmark.findMany({
    where: { profileId, postId: { in: ids } },
    select: { postId: true },
  });
  const set = new Set(rows.map((r) => r.postId));
  return posts.map((p) => ({ ...p, saved: set.has(p.id) }));
}

function repostPostFilter() {
  return {
    parentId: null,
    threadId: null,
    isClinicalCase: false,
    hidden: false,
    OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
  };
}

async function fetchRepostRows(reposterIds: string[], take: number) {
  if (reposterIds.length === 0) return [];
  return prisma.repost.findMany({
    where: {
      profileId: { in: reposterIds },
      post: repostPostFilter(),
    },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      profile: { select: { displayName: true, handle: true, avatarUrl: true } },
      post: { include: postInclude },
    },
  });
}

function mapRepostRow(
  r: Awaited<ReturnType<typeof fetchRepostRows>>[number],
  viewerProfileId: string
): FeedPost {
  return {
    ...mapPost(r.post as RawPost, viewerProfileId),
    repostedBy: {
      name: r.profile.displayName,
      handle: r.profile.handle,
      avatarUrl: r.profile.avatarUrl,
      time: timeAgo(r.createdAt),
    },
  };
}

function scoreForYouItem(
  post: RawPost,
  sortAt: Date,
  followingSet: Set<string>,
  specialty: string,
  country: string,
  now: number,
  fromNetworkRepost = false
) {
  let score = 0;
  const hours = (now - sortAt.getTime()) / 3_600_000;

  score += Math.max(0, 72 - hours) * 1.4;
  if (hours < 8) score += 10;
  if (post.author.verified) score += 14;
  if (followingSet.has(post.authorId)) score += 32;
  if (specialty && post.author.specialty?.toLowerCase() === specialty) score += 20;
  if (country && post.author.registrationCountry === country) score += 8;
  score += (post._count.likes + post._count.repostRecords * 2 + post._count.replies) * 2.5;
  if (fromNetworkRepost) score += 18;

  return score;
}

async function buildForYouFeed(
  posts: RawPost[],
  viewerProfileId: string,
  hiddenIds: string[]
): Promise<FeedPost[]> {
  const following = await prisma.follow.findMany({
    where: { followerId: viewerProfileId },
    select: { followingId: true },
  });
  const reposterIds = [viewerProfileId, ...following.map((f) => f.followingId)].filter(
    (id) => !hiddenIds.includes(id)
  );

  const [viewer, repostRows] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: viewerProfileId },
      select: { specialty: true, registrationCountry: true },
    }),
    fetchRepostRows(reposterIds, 80),
  ]);

  const followingSet = new Set(following.map((f) => f.followingId));
  const specialty = viewer?.specialty?.toLowerCase() ?? "";
  const country = viewer?.registrationCountry ?? "";
  const now = Date.now();

  type Item = { score: number; sortAt: Date; post: FeedPost };
  const items: Item[] = [
    ...posts.map((p) => ({
      score: scoreForYouItem(p, p.createdAt, followingSet, specialty, country, now),
      sortAt: p.createdAt,
      post: mapPost(p, viewerProfileId),
    })),
    ...repostRows.map((r) => ({
      score: scoreForYouItem(
        r.post as RawPost,
        r.createdAt,
        followingSet,
        specialty,
        country,
        now,
        true
      ),
      sortAt: r.createdAt,
      post: mapRepostRow(r, viewerProfileId),
    })),
  ];

  items.sort(
    (a, b) => b.score - a.score || b.sortAt.getTime() - a.sortAt.getTime()
  );
  return items.slice(0, 50).map((i) => i.post);
}

export async function getSessionUser(userId: string): Promise<SessionUser | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      id: true,
      displayName: true,
      handle: true,
      verified: true,
      verificationStatus: true,
      suspended: true,
      user: { select: { isAdmin: true, email: true } },
    },
  });
  if (!profile || profile.suspended) return null;

  const isAdmin = profile.user.isAdmin ||
    (process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ?? []).includes(
      profile.user.email.toLowerCase()
    );

  return {
    profileId: profile.id,
    displayName: profile.displayName,
    handle: profile.handle,
    verified: profile.verified,
    verificationStatus: profile.verificationStatus,
    isAdmin,
  };
}

export async function getFeedPosts(
  viewerProfileId: string,
  tab: FeedTab = "forYou",
  authorId?: string
): Promise<FeedPost[]> {
  await publishDueScheduledPosts();

  let authorWhere: { authorId?: string | { in: string[] } | { notIn: string[] } } = {};

  const [blockedIds, mutedIds] = await Promise.all([
    getBlockedProfileIds(viewerProfileId),
    getMutedProfileIds(viewerProfileId),
  ]);
  const hiddenIds = Array.from(new Set([...blockedIds, ...mutedIds]));

  if (authorId) {
    const blockStatus = blockedIds.includes(authorId);
    if (blockStatus) return [];
    authorWhere = { authorId };
  } else if (tab === "following") {
    const following = await prisma.follow.findMany({
      where: { followerId: viewerProfileId },
      select: { followingId: true },
    });
    const ids = [viewerProfileId, ...following.map((f) => f.followingId)].filter(
      (id) => !hiddenIds.includes(id)
    );
    authorWhere = { authorId: { in: ids } };

    const [posts, repostRows] = await Promise.all([
      prisma.post.findMany({
        where: {
          parentId: null,
          threadId: null,
          isClinicalCase: false,
          ...publishedWhere(),
          authorId: { in: ids },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: postInclude,
      }),
      fetchRepostRows(ids, 50),
    ]);

    type TimelineItem = { sortAt: Date; post: FeedPost };
    const items: TimelineItem[] = [
      ...posts.map((p) => ({
        sortAt: p.createdAt,
        post: mapPost(p as RawPost, viewerProfileId),
      })),
      ...repostRows.map((r) => ({
        sortAt: r.createdAt,
        post: mapRepostRow(r, viewerProfileId),
      })),
    ];

    items.sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime());
    const mapped = items.slice(0, 50).map((i) => i.post);
    return applyMutedWordFilter(await enrichSaved(mapped, viewerProfileId), viewerProfileId);
  } else if (hiddenIds.length > 0) {
    authorWhere = { authorId: { notIn: hiddenIds } };
  }

  const posts = await prisma.post.findMany({
    where: {
      parentId: null,
      threadId: null,
      isClinicalCase: false,
      ...publishedWhere(),
      ...authorWhere,
    },
    orderBy: { createdAt: "desc" },
    take: tab === "forYou" && !authorId ? 150 : 50,
    include: postInclude,
  });

  const ordered =
    tab === "forYou" && !authorId
      ? posts
      : (posts as RawPost[]);

  const mapped =
    tab === "forYou" && !authorId
      ? await buildForYouFeed(ordered as RawPost[], viewerProfileId, hiddenIds)
      : ordered.slice(0, 50).map((p) => mapPost(p as RawPost, viewerProfileId));

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

  return applyMutedWordFilter(await enrichSaved(mapped, viewerProfileId), viewerProfileId);
}

async function applyMutedWordFilter(posts: FeedPost[], viewerProfileId?: string) {
  if (!viewerProfileId) return posts;
  const words = await getMutedWords(viewerProfileId);
  return filterPostsByMutedWords(posts, words);
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
  if (post.hidden && post.authorId !== viewerProfileId) return null;
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
  const [following, blockedIds, viewer] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: viewerProfileId },
      select: { followingId: true },
    }),
    getBlockedProfileIds(viewerProfileId),
    prisma.profile.findUnique({
      where: { id: viewerProfileId },
      select: { specialty: true, registrationCountry: true },
    }),
  ]);

  const excludeIds = new Set([
    viewerProfileId,
    ...following.map((f) => f.followingId),
    ...blockedIds,
  ]);

  const select = {
    id: true,
    displayName: true,
    handle: true,
    specialty: true,
    registrationType: true,
    registrationNumber: true,
    verified: true,
  } as const;

  type Row = {
    id: string;
    displayName: string;
    handle: string;
    specialty: string | null;
    registrationType: string | null;
    registrationNumber: string | null;
    verified: boolean;
  };

  const candidates: Row[] = [];

  const addFrom = async (where: Record<string, unknown>, take = 8) => {
    if (candidates.length >= 5) return;
    const rows = await prisma.profile.findMany({
      where: { suspended: false, id: { notIn: Array.from(excludeIds) }, ...where },
      orderBy: { createdAt: "desc" },
      take,
      select,
    });
    for (const p of rows) {
      if (candidates.length >= 5) break;
      excludeIds.add(p.id);
      candidates.push(p);
    }
  };

  if (viewer?.specialty) {
    await addFrom({
      specialty: { equals: viewer.specialty, mode: "insensitive" },
      verified: true,
    });
  }
  if (viewer?.registrationCountry) {
    await addFrom({ registrationCountry: viewer.registrationCountry, verified: true });
  }
  if (viewer?.specialty) {
    await addFrom({ specialty: { equals: viewer.specialty, mode: "insensitive" } });
  }
  await addFrom({}, 5);

  return candidates.map((p) => ({
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

  const blockedIds = viewerProfileId ? await getBlockedProfileIds(viewerProfileId) : [];

  const links = await prisma.postHashtag.findMany({
    where: { hashtagId: hashtag.id },
    select: { postId: true },
    take: 50,
  });

  const posts = await prisma.post.findMany({
    where: {
      id: { in: links.map((l) => l.postId) },
      parentId: null,
      ...(blockedIds.length ? { authorId: { notIn: blockedIds } } : {}),
      ...publishedWhere(),
    },
    orderBy: { createdAt: "desc" },
    include: postInclude,
  });

  return posts.map((p) => mapPost(p as RawPost, viewerProfileId));
}

export async function getClinicalCasePosts(
  viewerProfileId: string
): Promise<FeedPost[]> {
  const blockedIds = await getBlockedProfileIds(viewerProfileId);

  const posts = await prisma.post.findMany({
    where: {
      isClinicalCase: true,
      parentId: null,
      threadId: null,
      ...(blockedIds.length ? { authorId: { notIn: blockedIds } } : {}),
      ...publishedWhere(),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: postInclude,
  });

  return posts.map((p) => mapPost(p as RawPost, viewerProfileId));
}

export async function getProfileByHandle(handle: string, viewerProfileId?: string) {
  const profile = await prisma.profile.findUnique({
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
  if (!profile) return null;
  if (profile.suspended && profile.id !== viewerProfileId) return null;
  return profile;
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

export async function searchProfiles(query: string, limit = 10, verifiedOnly = false, viewerProfileId?: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const blockedIds = viewerProfileId ? await getBlockedProfileIds(viewerProfileId) : [];

  return prisma.profile.findMany({
    where: {
      suspended: false,
      ...(verifiedOnly ? { verificationStatus: "VERIFIED" } : {}),
      ...(blockedIds.length ? { id: { notIn: blockedIds } } : {}),
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

  const blockedIds = viewerProfileId ? await getBlockedProfileIds(viewerProfileId) : [];
  const mutedIds = viewerProfileId ? await getMutedProfileIds(viewerProfileId) : [];
  const hiddenIds = Array.from(new Set([...blockedIds, ...mutedIds]));

  const posts = await prisma.post.findMany({
    where: {
      parentId: null,
      body: { contains: q, mode: "insensitive" },
      ...(hiddenIds.length ? { authorId: { notIn: hiddenIds } } : {}),
      ...publishedWhere(),
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: postInclude,
  });
  const mapped = posts.map((p) => mapPost(p as RawPost, viewerProfileId));
  return applyMutedWordFilter(mapped, viewerProfileId);
}

export async function getProfileLikedPosts(
  profileId: string,
  viewerProfileId: string
): Promise<FeedPost[]> {
  const likes = await prisma.like.findMany({
    where: { profileId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { post: { include: postInclude } },
  });

  return likes
    .filter((l) => !l.post.hidden && l.post.parentId === null)
    .map((l) => mapPost(l.post as RawPost, viewerProfileId));
}

export async function getScheduledPosts(viewerProfileId: string) {
  const now = new Date();
  const posts = await prisma.post.findMany({
    where: {
      authorId: viewerProfileId,
      parentId: null,
      scheduledAt: { gt: now },
    },
    orderBy: { scheduledAt: "asc" },
    include: postInclude,
  });
  return posts.map((p) => mapPost(p as RawPost, viewerProfileId));
}

export async function getProfileReplies(
  profileId: string,
  viewerProfileId: string
): Promise<FeedPost[]> {
  const posts = await prisma.post.findMany({
    where: {
      authorId: profileId,
      parentId: { not: null },
      ...publishedWhere(),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: postInclude,
  });
  return posts.map((p) => mapPost(p as RawPost, viewerProfileId));
}

export async function getSavedPosts(viewerProfileId: string): Promise<FeedPost[]> {
  const bookmarks = await prisma.bookmark.findMany({
    where: { profileId: viewerProfileId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      post: { include: postInclude },
    },
  });

  return bookmarks
    .filter((b) => b.post.parentId === null && !b.post.hidden)
    .map((b) => ({ ...mapPost(b.post as RawPost, viewerProfileId), saved: true }));
}
export async function getPostsForList(
  listId: string,
  viewerProfileId?: string
): Promise<FeedPost[]> {
  const allowed = await canViewListPosts(listId, viewerProfileId);
  if (!allowed) return [];

  const list = await prisma.profileList.findUnique({
    where: { id: listId },
    include: { members: { select: { profileId: true } } },
  });
  if (!list || list.members.length === 0) return [];

  const memberIds = list.members.map((m) => m.profileId);
  const posts = await prisma.post.findMany({
    where: {
      parentId: null,
      threadId: null,
      authorId: { in: memberIds },
      isClinicalCase: false,
      ...publishedWhere(),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: postInclude,
  });

  return enrichSaved(
    posts.map((p) => mapPost(p as RawPost, viewerProfileId)),
    viewerProfileId
  );
}

export { formatCount };
