"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toggleUniqueRecord } from "@/lib/toggle-record";

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

  await toggleUniqueRecord(
    () => prisma.bookmark.deleteMany({ where: { profileId, postId } }),
    async () => {
      await prisma.bookmark.create({ data: { profileId, postId } });
    }
  );

  revalidatePath("/feed");
  revalidatePath("/salvos");
  revalidatePath(`/post/${postId}`);
}
