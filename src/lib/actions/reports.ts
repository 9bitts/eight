"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { requireAdmin } from "@/lib/admin";
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
      targetPostId: targetType === "POST" ? targetId : null,
      targetProfileId: targetType === "PROFILE" ? targetId : null,
      reason,
      details: details?.trim() || null,
    },
    update: {
      reason,
      details: details?.trim() || null,
      targetPostId: targetType === "POST" ? targetId : null,
      targetProfileId: targetType === "PROFILE" ? targetId : null,
    },
  });
}

export async function getReportsForAdmin() {
  await requireAdmin();

  const rows = await prisma.report.findMany({
    where: { reviewedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      reporter: { select: { displayName: true, handle: true } },
      targetPost: { select: { id: true } },
      reportedProfile: { select: { id: true, handle: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    targetType: r.targetType,
    targetId: r.targetId,
    reason: r.reason,
    details: r.details,
    createdAt: r.createdAt,
    reporter: r.reporter,
    targetHandle:
      r.targetType === "PROFILE" ? r.reportedProfile?.handle ?? null : null,
    targetExists:
      r.targetType === "POST" ? !!r.targetPost : !!r.reportedProfile,
  }));
}

export async function dismissReport(reportId: string) {
  await requireAdmin();

  await prisma.report.update({
    where: { id: reportId },
    data: { reviewedAt: new Date() },
  });

  revalidatePath("/admin/denuncias");
}

export async function adminHidePost(postId: string) {
  await requireAdmin();

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
  await requireAdmin();

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
