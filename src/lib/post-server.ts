import { prisma } from "@/lib/prisma";
import { extractHashtags, extractMentions } from "@/lib/post-text";
import { createNotificationIfAllowed } from "@/lib/notifications-server";

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

