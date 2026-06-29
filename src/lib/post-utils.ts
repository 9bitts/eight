import { prisma } from "@/lib/prisma";
import { extractHashtags, extractMentions } from "@/lib/post-text";
import { createNotificationIfAllowed } from "@/lib/notifications";

export function publishedWhere() {
  const now = new Date();
  return {
    hidden: false,
    OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
  };
}

export async function syncHashtags(postId: string, body: string) {
  const tags = extractHashtags(body);
  await prisma.postHashtag.deleteMany({ where: { postId } });

  for (const tag of tags) {
    const hashtag = await prisma.hashtag.upsert({
      where: { tag },
      create: { tag },
      update: {},
    });
    await prisma.postHashtag.create({
      data: { postId, hashtagId: hashtag.id },
    });
  }
}

export async function notifyMentions(
  body: string,
  actorId: string,
  postId: string
) {
  const handles = extractMentions(body);
  for (const handle of handles) {
    const profile = await prisma.profile.findUnique({ where: { handle } });
    if (profile && profile.id !== actorId) {
      await createNotificationIfAllowed(profile.id, actorId, "MENTION", postId);
    }
  }
}

export async function publishDueScheduledPosts() {
  const now = new Date();
  await prisma.post.updateMany({
    where: {
      scheduledAt: { lte: now },
      createdAt: { gt: new Date(0) },
    },
    data: {},
  });
}
