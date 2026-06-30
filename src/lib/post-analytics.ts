import { prisma } from "@/lib/prisma";
import { publishedWhere } from "@/lib/post-filters";

export type PostViewStat = {
  id: string;
  bodyPreview: string;
  views: number;
  views7d: number;
  likes: number;
  replies: number;
  createdAt: Date;
};

export async function getPostViewAnalytics(profileId: string) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const posts = await prisma.post.findMany({
    where: {
      authorId: profileId,
      parentId: null,
      threadId: null,
      ...publishedWhere(),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      body: true,
      createdAt: true,
      _count: {
        select: { views: true, likes: true, replies: true },
      },
      views: {
        where: { createdAt: { gte: weekAgo } },
        select: { id: true },
      },
    },
  });

  const items: PostViewStat[] = posts.map((p) => ({
    id: p.id,
    bodyPreview: p.body.length > 80 ? `${p.body.slice(0, 80)}…` : p.body,
    views: p._count.views,
    views7d: p.views.length,
    likes: p._count.likes,
    replies: p._count.replies,
    createdAt: p.createdAt,
  }));

  items.sort((a, b) => b.views - a.views);

  const totalViews = items.reduce((s, p) => s + p.views, 0);
  const views7d = items.reduce((s, p) => s + p.views7d, 0);

  return { totalViews, views7d, posts: items };
}

export type ViewTimelinePoint = {
  date: string;
  label: string;
  profileViews: number;
  postViews: number;
};

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function lastNDays(n: number) {
  const days: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

export async function getViewTimeline(profileId: string, days = 14): Promise<ViewTimelinePoint[]> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const [profileViews, postViews] = await Promise.all([
    prisma.profileView.findMany({
      where: { profileId, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.postView.findMany({
      where: { post: { authorId: profileId }, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  const profileMap = new Map<string, number>();
  const postMap = new Map<string, number>();

  for (const v of profileViews) {
    const k = dayKey(v.createdAt);
    profileMap.set(k, (profileMap.get(k) ?? 0) + 1);
  }
  for (const v of postViews) {
    const k = dayKey(v.createdAt);
    postMap.set(k, (postMap.get(k) ?? 0) + 1);
  }

  return lastNDays(days).map((d) => {
    const k = dayKey(d);
    return {
      date: k,
      label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      profileViews: profileMap.get(k) ?? 0,
      postViews: postMap.get(k) ?? 0,
    };
  });
}
