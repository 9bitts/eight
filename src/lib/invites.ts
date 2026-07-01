import { randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const SITE = () =>
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://doctor8.com.br";

export function generateInviteCode(): string {
  return randomBytes(16).toString("hex");
}

export async function createInvite(email: string, createdById?: string, daysValid = 30) {
  const normalized = email.trim().toLowerCase();
  const code = generateInviteCode();
  const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);

  return prisma.invite.create({
    data: {
      email: normalized,
      code,
      createdById: createdById ?? null,
      expiresAt,
    },
  });
}

export async function validateInvite(code: string, email: string) {
  const invite = await prisma.invite.findUnique({ where: { code: code.trim() } });
  if (!invite) return { ok: false as const, error: "Convite inválido." };
  if (invite.usedAt) return { ok: false as const, error: "Este convite já foi utilizado." };
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return { ok: false as const, error: "Convite expirado." };
  }
  if (invite.email !== email.trim().toLowerCase()) {
    return { ok: false as const, error: "O convite não corresponde a este e-mail." };
  }
  return { ok: true as const, invite };
}

export async function markInviteUsed(code: string, userId: string) {
  const claimed = await claimInvite(code, userId);
  if (!claimed) {
    throw new Error("Convite inválido ou já utilizado.");
  }
}

/** Marca convite como usado de forma atômica (evita race condition no cadastro). */
export async function claimInvite(code: string, userId: string): Promise<boolean> {
  const result = await prisma.invite.updateMany({
    where: {
      code: code.trim(),
      usedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    data: { usedAt: new Date(), usedById: userId },
  });
  return result.count === 1;
}

export async function createUserWithInvite(
  inviteCode: string,
  email: string,
  userData: Prisma.UserCreateInput
) {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedCode = inviteCode.trim();

  return prisma.$transaction(async (tx) => {
    const claimed = await tx.invite.updateMany({
      where: {
        code: trimmedCode,
        usedAt: null,
        email: normalizedEmail,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) {
      throw new Error("Convite inválido ou já utilizado.");
    }

    const user = await tx.user.create({
      data: userData,
      include: { profile: true },
    });

    await tx.invite.update({
      where: { code: trimmedCode },
      data: { usedById: user.id },
    });

    return user;
  });
}

export async function sendInviteEmail(email: string, code: string) {
  const link = `${SITE()}/signup?invite=${code}`;
  const result = await sendEmail({
    to: email,
    subject: "Convite para a eight — rede Doctor8",
    html: `
      <p>Você foi convidado para a <strong>eight</strong>, a rede dos profissionais de saúde.</p>
      <p><a href="${link}">Criar minha conta</a></p>
      <p style="color:#666;font-size:13px">Ou copie o link: ${link}</p>
    `,
  });
  if (result.sent) {
    await prisma.invite.update({
      where: { code },
      data: { emailSentAt: new Date() },
    });
  }
  return result;
}

export async function listInvites(limit = 100) {
  return prisma.invite.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { createdBy: { select: { email: true } } },
  });
}

export function inviteRequired() {
  return process.env.INVITE_REQUIRED === "true";
}
