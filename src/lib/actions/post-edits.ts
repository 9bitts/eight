"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPostEditHistory } from "@/lib/post-edits";

export async function fetchPostEditHistory(postId: string) {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) throw new Error("Não autorizado");

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, hidden: true },
  });
  if (!post) throw new Error("Publicação não encontrada");
  if (post.hidden && post.authorId !== profileId) throw new Error("Não autorizado");

  return getPostEditHistory(postId);
}
