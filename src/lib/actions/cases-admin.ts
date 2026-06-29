"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Não autorizado");
}

export async function getClinicalCasesForAdmin() {
  await requireAdmin();

  return prisma.post.findMany({
    where: { isClinicalCase: true, parentId: null },
    orderBy: [{ caseReviewedAt: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      author: {
        select: { displayName: true, handle: true, verified: true, specialty: true },
      },
      _count: { select: { likes: true, replies: true } },
    },
  });
}

export async function adminReviewClinicalCase(postId: string) {
  await requireAdmin();

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post?.isClinicalCase) throw new Error("Caso não encontrado.");

  await prisma.post.update({
    where: { id: postId },
    data: { caseReviewedAt: new Date() },
  });

  revalidatePath("/admin/casos");
  revalidatePath("/cases");
}

export async function adminHideClinicalCase(postId: string) {
  await requireAdmin();

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post?.isClinicalCase) throw new Error("Caso não encontrado.");

  await prisma.profile.updateMany({
    where: { pinnedPostId: postId },
    data: { pinnedPostId: null },
  });

  await prisma.post.update({
    where: { id: postId },
    data: { hidden: true, caseReviewedAt: new Date() },
  });

  revalidatePath("/admin/casos");
  revalidatePath("/cases");
  revalidatePath("/feed");
}

export async function adminRestoreClinicalCase(postId: string) {
  await requireAdmin();

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post?.isClinicalCase) throw new Error("Caso não encontrado.");

  await prisma.post.update({
    where: { id: postId },
    data: { hidden: false },
  });

  revalidatePath("/admin/casos");
  revalidatePath("/cases");
}
