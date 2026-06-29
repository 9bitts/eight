import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { passwordError } from "@/lib/validators";

const RESET_TTL_MS = 60 * 60 * 1000;

function resetIdentifier(email: string) {
  return `reset:${email.trim().toLowerCase()}`;
}

function siteUrl() {
  return (
    process.env.AUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export async function requestPasswordReset(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { ok: true as const };

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user?.passwordHash) return { ok: true as const };

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + RESET_TTL_MS);
  const identifier = resetIdentifier(normalized);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  const link = `${siteUrl()}/login/redefinir-senha?token=${token}&email=${encodeURIComponent(normalized)}`;

  const result = await sendEmail({
    to: normalized,
    subject: "Redefinir senha — eight",
    html: `
      <p>Olá,</p>
      <p>Recebemos um pedido para redefinir a senha da sua conta na <strong>eight</strong>.</p>
      <p><a href="${link}">Clique aqui para criar uma nova senha</a></p>
      <p>O link expira em 1 hora. Se você não pediu isso, ignore este e-mail.</p>
      <p style="color:#7a8f97;font-size:13px">Doctor8 · eight</p>
    `,
    text: `Redefinir senha: ${link}\n\nO link expira em 1 hora.`,
  });

  if (!result.sent && process.env.NODE_ENV === "development") {
    console.log("[password-reset] SMTP off — link de teste:", link);
  }

  return { ok: true as const, emailSent: result.sent, smtpConfigured: isEmailConfigured() };
}

export async function resetPasswordWithToken(
  email: string,
  token: string,
  newPassword: string
) {
  const normalized = email.trim().toLowerCase();
  const passErr = passwordError(newPassword);
  if (passErr) throw new Error(passErr);

  const row = await prisma.verificationToken.findFirst({
    where: { identifier: resetIdentifier(normalized), token },
  });
  if (!row || row.expires < new Date()) {
    throw new Error("Link expirado ou inválido. Solicite um novo.");
  }

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user?.passwordHash) {
    throw new Error("Esta conta não usa senha por e-mail.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { email: normalized }, data: { passwordHash } }),
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier: row.identifier, token: row.token } },
    }),
  ]);
}
