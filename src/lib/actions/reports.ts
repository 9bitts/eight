"use server";

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
