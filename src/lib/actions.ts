"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchLinkPreview } from "@/lib/link-preview";
import { extractFirstUrl } from "@/lib/post-text";
import { syncHashtags, notifyMentions } from "@/lib/post-utils";
import { createNotificationIfAllowed } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";
import type { CreatePostInput } from "@/lib/types";

async function requireProfile() {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) throw new Error("Não autorizado");

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { suspended: true },
  });
  if (profile?.suspended) throw new Error("Conta suspensa. Entre em contato com o suporte.");

  return profileId;
}

async function notify(
  recipientId: string,
  actorId: string,
  type: "LIKE" | "REPOST" | "FOLLOW" | "REPLY" | "MENTION",
  postId?: string
) {
  await createNotificationIfAllowed(recipientId, actorId, type, postId);
}

async function buildLinkFields(body: string) {
  const url = extractFirstUrl(body);
  if (!url) return {};
  const preview = await fetchLinkPreview(url);
  if (!preview) return { linkUrl: url };
  return {
    linkUrl: preview.url,
    linkTitle: preview.title,
    linkDesc: preview.description,
    linkImage: preview.image,
  };
}

async function createSinglePost(
  profileId: string,
  data: {
    body: string;
    images?: string[];
    videoUrl?: string;
    gifUrl?: string;
    scheduledAt?: Date | null;
    parentId?: string;
    threadId?: string;
    threadOrder?: number;
  }
) {
  const text = data.body.trim();
  if (!text && !(data.images?.length || data.videoUrl || data.gifUrl)) {
    throw new Error("Publicação vazia");
  }
  if (text.length > 500) throw new Error("Máximo 500 caracteres");

  const linkFields = text ? await buildLinkFields(text) : {};

  const post = await prisma.post.create({
    data: {
      authorId: profileId,
      body: text || " ",
      parentId: data.parentId ?? null,
      threadId: data.threadId ?? null,
      threadOrder: data.threadOrder ?? 0,
      images: data.images ?? [],
      videoUrl: data.videoUrl ?? null,
      gifUrl: data.gifUrl ?? null,
      scheduledAt: data.scheduledAt ?? null,
      ...linkFields,
    },
    include: { parent: { select: { authorId: true } } },
  });

  if (text) {
    await syncHashtags(post.id, text);
    await notifyMentions(text, profileId, post.id);
  }

  if (data.parentId && post.parent) {
    await notify(post.parent.authorId, profileId, "REPLY", data.parentId);
  }

  return post;
}

export async function createPost(input: CreatePostInput) {
  const profileId = await requireProfile();

  const limited = rateLimit(`post:${profileId}`, 20, 60_000);
  if (!limited.ok) throw new Error(`Aguarde ${limited.retryAfterSec}s antes de publicar novamente.`);

  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  if (scheduledAt && scheduledAt <= new Date()) {
    throw new Error("Data de agendamento deve ser no futuro");
  }

  const threadParts = (input.threadParts ?? []).map((p) => p.trim()).filter(Boolean);
  const pollOptions = (input.pollOptions ?? []).map((p) => p.trim()).filter(Boolean);

  const root = await createSinglePost(profileId, {
    body: input.body,
    images: input.images,
    videoUrl: input.videoUrl,
    gifUrl: input.gifUrl,
    scheduledAt,
    parentId: input.parentId,
  });

  if (pollOptions.length >= 2 && pollOptions.length <= 4) {
    const hours = input.pollEndsInHours ?? 24;
    await prisma.poll.create({
      data: {
        postId: root.id,
        endsAt: new Date(Date.now() + hours * 60 * 60 * 1000),
        options: {
          create: pollOptions.map((text, i) => ({ text, sortOrder: i })),
        },
      },
    });
  }

  for (let i = 0; i < threadParts.length; i++) {
    await createSinglePost(profileId, {
      body: threadParts[i],
      scheduledAt,
      threadId: root.id,
      threadOrder: i + 1,
    });
  }

  revalidatePath("/feed");
  return { id: root.id };
}

export async function editPost(postId: string, body: string) {
  const profileId = await requireProfile();
  const text = body.trim();
  if (!text || text.length > 500) throw new Error("Texto inválido");

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.authorId !== profileId) throw new Error("Não autorizado");

  const linkFields = await buildLinkFields(text);

  await prisma.post.update({
    where: { id: postId },
    data: { body: text, editedAt: new Date(), ...linkFields },
  });

  await syncHashtags(postId, text);
  await notifyMentions(text, profileId, postId);

  revalidatePath("/feed");
  revalidatePath(`/post/${postId}`);
}

export async function deletePost(postId: string) {
  const profileId = await requireProfile();
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.authorId !== profileId) throw new Error("Não autorizado");

  await prisma.profile.updateMany({
    where: { pinnedPostId: postId },
    data: { pinnedPostId: null },
  });

  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/feed");
  revalidatePath("/agendados");
}

export async function cancelScheduledPost(postId: string) {
  const profileId = await requireProfile();
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.authorId !== profileId) throw new Error("Não autorizado");
  if (!post.scheduledAt || post.scheduledAt <= new Date()) {
    throw new Error("Esta publicação já foi enviada ou não está agendada.");
  }

  await prisma.profile.updateMany({
    where: { pinnedPostId: postId },
    data: { pinnedPostId: null },
  });

  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/agendados");
  revalidatePath("/feed");
}

export async function pinPost(postId: string) {
  const profileId = await requireProfile();
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.authorId !== profileId) throw new Error("Não autorizado");

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  const newPin = profile?.pinnedPostId === postId ? null : postId;

  await prisma.profile.update({
    where: { id: profileId },
    data: { pinnedPostId: newPin },
  });

  revalidatePath("/feed");
  revalidatePath(`/${(await prisma.profile.findUnique({ where: { id: profileId } }))?.handle}`);
}

export async function votePoll(pollId: string, optionId: string) {
  const profileId = await requireProfile();

  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { options: true },
  });
  if (!poll || poll.endsAt < new Date()) throw new Error("Enquete encerrada");
  if (!poll.options.some((o) => o.id === optionId)) throw new Error("Opção inválida");

  await prisma.pollVote.upsert({
    where: { profileId_pollId: { profileId, pollId } },
    create: { profileId, pollId, optionId },
    update: { optionId },
  });

  revalidatePath("/feed");
}

export async function toggleLike(postId: string) {
  const profileId = await requireProfile();
  const existing = await prisma.like.findUnique({
    where: { profileId_postId: { profileId, postId } },
  });
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (!post) throw new Error("Publicação não encontrada");

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { profileId, postId } });
    await notify(post.authorId, profileId, "LIKE", postId);
  }
  revalidatePath("/feed");
  revalidatePath(`/post/${postId}`);
}

export async function toggleRepost(postId: string) {
  const profileId = await requireProfile();
  const existing = await prisma.repost.findUnique({
    where: { profileId_postId: { profileId, postId } },
  });
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (!post) throw new Error("Publicação não encontrada");

  if (existing) {
    await prisma.repost.delete({ where: { id: existing.id } });
  } else {
    await prisma.repost.create({ data: { profileId, postId } });
    await notify(post.authorId, profileId, "REPOST", postId);
  }
  revalidatePath("/feed");
  revalidatePath(`/post/${postId}`);
}

export async function createQuotePost(postId: string, body: string) {
  const profileId = await requireProfile();
  const limited = rateLimit(`post:${profileId}`, 20, 60_000);
  if (!limited.ok) throw new Error("Muitas publicações. Aguarde um momento.");

  const original = await prisma.post.findUnique({ where: { id: postId } });
  if (!original) throw new Error("Publicação não encontrada");

  const text = body.trim();
  if (!text) throw new Error("Adicione um comentário à citação.");
  if (text.length > 500) throw new Error("Máximo 500 caracteres");

  const linkFields = await buildLinkFields(text);

  const post = await prisma.post.create({
    data: {
      authorId: profileId,
      body: text,
      repostOfId: postId,
      ...linkFields,
    },
  });

  await prisma.repost.upsert({
    where: { profileId_postId: { profileId, postId } },
    create: { profileId, postId },
    update: {},
  });

  await syncHashtags(post.id, text);
  await notifyMentions(post.id, text, profileId);
  await notify(original.authorId, profileId, "REPOST", post.id);

  revalidatePath("/feed");
  revalidatePath(`/post/${postId}`);
}

export async function toggleFollow(targetProfileId: string) {
  const profileId = await requireProfile();
  if (profileId === targetProfileId) throw new Error("Ação inválida");

  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: profileId, blockedId: targetProfileId },
        { blockerId: targetProfileId, blockedId: profileId },
      ],
    },
  });
  if (block) throw new Error("Não é possível seguir este perfil.");

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: profileId, followingId: targetProfileId } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({ data: { followerId: profileId, followingId: targetProfileId } });
    await notify(targetProfileId, profileId, "FOLLOW");
  }
  revalidatePath("/feed");
  revalidatePath("/explore");
}

export async function markNotificationsRead() {
  const profileId = await requireProfile();
  await prisma.notification.updateMany({
    where: { recipientId: profileId, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
}
