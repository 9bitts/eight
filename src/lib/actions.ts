"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireProfile() {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) throw new Error("Não autorizado");
  return profileId;
}

async function notify(
  recipientId: string,
  actorId: string,
  type: "LIKE" | "REPOST" | "FOLLOW" | "REPLY",
  postId?: string
) {
  if (recipientId === actorId) return;
  await prisma.notification.create({
    data: { recipientId, actorId, type, postId: postId ?? null },
  });
}

export async function createPost(body: string, parentId?: string) {
  const profileId = await requireProfile();
  const text = body.trim();
  if (!text || text.length > 500) throw new Error("Publicação inválida");

  const post = await prisma.post.create({
    data: {
      authorId: profileId,
      body: text,
      parentId: parentId ?? null,
    },
    include: { parent: { select: { authorId: true } } },
  });

  if (parentId && post.parent) {
    await notify(post.parent.authorId, profileId, "REPLY", parentId);
  }

  revalidatePath("/feed");
  revalidatePath(`/post/${parentId ?? post.id}`);
  return { id: post.id };
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

export async function toggleFollow(targetProfileId: string) {
  const profileId = await requireProfile();
  if (profileId === targetProfileId) throw new Error("Ação inválida");

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId: profileId, followingId: targetProfileId },
    },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({
      data: { followerId: profileId, followingId: targetProfileId },
    });
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
