"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type ReportTarget = "POST" | "PROFILE";
type ReportReason = "SPAM" | "HARASSMENT" | "MISINFORMATION" | "PRIVACY" | "OTHER";

async function requireProfile() {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) throw new Error("Não autorizado");
  return profileId;
}

export async function submitReport(
  targetType: ReportTarget,
  targetId: string,
  reason: ReportReason,
  details?: string
) {
  const profileId = await requireProfile();

  if (targetType === "PROFILE" && targetId === profileId) {
    throw new Error("Ação inválida.");
  }

  if (targetType === "POST") {
    const post = await prisma.post.findUnique({ where: { id: targetId } });
    if (!post) throw new Error("Publicação não encontrada.");
    if (post.authorId === profileId) throw new Error("Ação inválida.");
  } else {
    const profile = await prisma.profile.findUnique({ where: { id: targetId } });
    if (!profile) throw new Error("Perfil não encontrado.");
  }

  await prisma.report.upsert({
    where: {
      reporterId_targetType_targetId: {
        reporterId: profileId,
        targetType,
        targetId,
      },
    },
    create: {
      reporterId: profileId,
      targetType,
      targetId,
      reason,
      details: details?.trim() || null,
    },
    update: {
      reason,
      details: details?.trim() || null,
    },
  });
}

export async function getReportsForAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Não autorizado");

  const rows = await prisma.report.findMany({
    where: { reviewedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      reporter: { select: { displayName: true, handle: true } },
    },
  });

  const profileIds = rows.filter((r) => r.targetType === "PROFILE").map((r) => r.targetId);
  const profiles = profileIds.length
    ? await prisma.profile.findMany({
        where: { id: { in: profileIds } },
        select: { id: true, handle: true },
      })
    : [];
  const handleById = new Map(profiles.map((p) => [p.id, p.handle]));

  return rows.map((r) => ({
    ...r,
    targetHandle: r.targetType === "PROFILE" ? handleById.get(r.targetId) ?? null : null,
  }));
}

export async function dismissReport(reportId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Não autorizado");

  await prisma.report.update({
    where: { id: reportId },
    data: { reviewedAt: new Date() },
  });

  revalidatePath("/admin/denuncias");
}

export async function adminHidePost(postId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Não autorizado");

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Publicação não encontrada.");

  await prisma.profile.updateMany({
    where: { pinnedPostId: postId },
    data: { pinnedPostId: null },
  });

  await prisma.post.update({
    where: { id: postId },
    data: { hidden: true },
  });

  revalidatePath("/feed");
  revalidatePath(`/post/${postId}`);
  revalidatePath("/admin/denuncias");
}

export async function adminSuspendProfile(profileId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Não autorizado");

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) throw new Error("Perfil não encontrado.");

  await prisma.profile.update({
    where: { id: profileId },
    data: {
      suspended: true,
      verified: false,
      verificationStatus: "REJECTED",
      rejectionReason: "Conta suspensa por violação das regras da plataforma.",
    },
  });

  revalidatePath("/admin/denuncias");
  revalidatePath(`/${profile.handle}`);
}
