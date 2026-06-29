"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import {
  createInvite,
  listInvites,
  sendInviteEmail,
} from "@/lib/invites";

export async function createInvitesFromList(
  emailsRaw: string,
  sendEmails: boolean
) {
  const adminId = await requireAdmin();
  const emails = emailsRaw
    .split(/[\n,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"));

  if (emails.length === 0) throw new Error("Informe ao menos um e-mail válido.");
  if (emails.length > 500) throw new Error("Máximo 500 e-mails por vez.");

  const results: { email: string; code: string; sent: boolean }[] = [];

  for (const email of emails) {
    const invite = await createInvite(email, adminId);
    let sent = false;
    if (sendEmails) {
      const r = await sendInviteEmail(email, invite.code);
      sent = r.sent;
    }
    results.push({ email, code: invite.code, sent });
  }

  revalidatePath("/admin/convites");
  return results;
}

export async function getAdminInvites() {
  await requireAdmin();
  return listInvites(200);
}

export async function resendInviteEmail(code: string) {
  await requireAdmin();
  const invite = (await listInvites(200)).find((i) => i.code === code);
  if (!invite) throw new Error("Convite não encontrado");
  if (invite.usedAt) throw new Error("Convite já utilizado.");
  const r = await sendInviteEmail(invite.email, invite.code);
  revalidatePath("/admin/convites");
  return r;
}
