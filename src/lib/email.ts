import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const transport = getTransport();
  if (!transport) {
    console.warn("[email] SMTP não configurado — e-mail não enviado:", opts.to, opts.subject);
    return { sent: false, reason: "smtp_not_configured" as const };
  }

  const from = process.env.SMTP_FROM ?? "eight <noreply@doctor8.com.br>";
  await transport.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text ?? opts.html.replace(/<[^>]+>/g, ""),
  });
  return { sent: true as const };
}

export function isEmailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function siteUrl() {
  return (
    process.env.AUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://doctor8.com.br"
  ).replace(/\/$/, "");
}

export async function sendVerificationApprovedEmail(to: string, displayName: string) {
  return sendEmail({
    to,
    subject: "Selo verificado aprovado — eight",
    html: `
      <p>Olá, <strong>${displayName}</strong>,</p>
      <p>Seu registro profissional foi <strong>aprovado</strong>. O selo verificado já aparece no seu perfil na eight.</p>
      <p><a href="${siteUrl()}/feed">Acessar a eight</a></p>
      <p style="color:#7a8f97;font-size:13px">Doctor8 · eight</p>
    `,
  });
}

export async function sendVerificationRejectedEmail(
  to: string,
  displayName: string,
  reason: string
) {
  return sendEmail({
    to,
    subject: "Verificação — atualização — eight",
    html: `
      <p>Olá, <strong>${displayName}</strong>,</p>
      <p>Sua solicitação de verificação profissional não foi aprovada neste momento.</p>
      <p><strong>Motivo:</strong> ${reason}</p>
      <p>Você pode enviar novamente em <a href="${siteUrl()}/verificacao">Verificação profissional</a>.</p>
      <p style="color:#7a8f97;font-size:13px">Doctor8 · eight</p>
    `,
  });
}
