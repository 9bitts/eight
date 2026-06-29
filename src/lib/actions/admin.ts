"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function approveVerification(profileId: string) {
  const adminUserId = await requireAdmin();

  const adminProfile = await prisma.profile.findUnique({
    where: { userId: adminUserId },
    select: { id: true },
  });

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { id: true, displayName: true, verificationStatus: true },
  });
  if (!profile) throw new Error("Perfil não encontrado");
  if (profile.verificationStatus === "VERIFIED") {
    throw new Error("Já verificado");
  }

  await prisma.profile.update({
    where: { id: profileId },
    data: {
      verified: true,
      verificationStatus: "VERIFIED",
      verifiedAt: new Date(),
      verificationReviewedAt: new Date(),
      rejectionReason: null,
    },
  });

  await prisma.notification.create({
    data: {
      recipientId: profileId,
      actorId: adminProfile?.id ?? profileId,
      type: "VERIFICATION_APPROVED",
    },
  });

  revalidatePath("/admin/verificacoes");
  revalidatePath("/verificacao");
  revalidatePath("/feed");
  return { ok: true, name: profile.displayName };
}

export async function rejectVerification(profileId: string, reason: string) {
  const adminUserId = await requireAdmin();

  const adminProfile = await prisma.profile.findUnique({
    where: { userId: adminUserId },
    select: { id: true },
  });

  const text = reason.trim();
  if (!text || text.length < 10) {
    throw new Error("Informe o motivo da recusa (mínimo 10 caracteres).");
  }

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) throw new Error("Perfil não encontrado");

  await prisma.profile.update({
    where: { id: profileId },
    data: {
      verified: false,
      verificationStatus: "REJECTED",
      verifiedAt: null,
      verificationReviewedAt: new Date(),
      rejectionReason: text,
    },
  });

  await prisma.notification.create({
    data: {
      recipientId: profileId,
      actorId: adminProfile?.id ?? profileId,
      type: "VERIFICATION_REJECTED",
    },
  });

  revalidatePath("/admin/verificacoes");
  revalidatePath("/verificacao");
  return { ok: true };
}

export async function getPendingVerifications() {
  await requireAdmin();

  return prisma.profile.findMany({
    where: { verificationStatus: "PENDING" },
    orderBy: { verificationSubmittedAt: "asc" },
    include: {
      user: { select: { email: true, createdAt: true } },
    },
  });
}

export async function getRecentVerificationReviews() {
  await requireAdmin();

  return prisma.profile.findMany({
    where: {
      verificationStatus: { in: ["VERIFIED", "REJECTED"] },
      verificationReviewedAt: { not: null },
    },
    orderBy: { verificationReviewedAt: "desc" },
    take: 20,
    include: {
      user: { select: { email: true } },
    },
  });
}
