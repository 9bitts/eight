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

export async function toggleBookmark(postId: string) {
  const profileId = await requireProfile();

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Publicação não encontrada.");

  const existing = await prisma.bookmark.findUnique({
    where: { profileId_postId: { profileId, postId } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { profileId_postId: { profileId, postId } } });
  } else {
    await prisma.bookmark.create({ data: { profileId, postId } });
  }

  revalidatePath("/feed");
  revalidatePath("/salvos");
  revalidatePath(`/post/${postId}`);
}
