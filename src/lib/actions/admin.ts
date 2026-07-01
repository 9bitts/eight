"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  notificationDedupeKey,
} from "@/lib/notifications-server";
import { isUniqueViolation } from "@/lib/prisma-errors";
import {
  sendVerificationApprovedEmail,
  sendVerificationRejectedEmail,
} from "@/lib/email";

export async function approveVerification(profileId: string) {
  const adminUserId = await requireAdmin();

  const adminProfile = await prisma.profile.findUnique({
    where: { userId: adminUserId },
    select: { id: true },
  });

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      displayName: true,
      verificationStatus: true,
      user: { select: { email: true } },
    },
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

  try {
    await prisma.notification.create({
      data: {
        recipientId: profileId,
        actorId: adminProfile?.id ?? profileId,
        type: "VERIFICATION_APPROVED",
        dedupeKey: notificationDedupeKey(
          profileId,
          adminProfile?.id ?? profileId,
          "VERIFICATION_APPROVED"
        ),
      },
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }

  revalidatePath("/admin/verificacoes");
  revalidatePath("/verificacao");
  revalidatePath("/feed");

  if (profile.user.email) {
    await sendVerificationApprovedEmail(profile.user.email, profile.displayName);
  }

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

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { user: { select: { email: true } } },
  });
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

  try {
    await prisma.notification.create({
      data: {
        recipientId: profileId,
        actorId: adminProfile?.id ?? profileId,
        type: "VERIFICATION_REJECTED",
        dedupeKey: notificationDedupeKey(
          profileId,
          adminProfile?.id ?? profileId,
          "VERIFICATION_REJECTED"
        ),
      },
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }

  revalidatePath("/admin/verificacoes");
  revalidatePath("/verificacao");

  if (profile.user.email) {
    await sendVerificationRejectedEmail(profile.user.email, profile.displayName, text);
  }

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
