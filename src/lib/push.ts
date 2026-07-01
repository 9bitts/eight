import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let vapidReady = false;

function ensureVapid() {
  if (vapidReady) return isPushConfigured();
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:contato@doctor8.com.br",
    publicKey,
    privateKey
  );
  vapidReady = true;
  return true;
}

export function isPushConfigured() {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY ?? null;
}

export async function sendPushToProfile(
  profileId: string,
  payload: { title: string; body: string; url: string }
) {
  if (!ensureVapid()) return;

  const subs = await prisma.pushSubscription.findMany({
    where: { profileId },
  });
  if (!subs.length) return;

  const data = JSON.stringify(payload);
  const stale: string[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          data
        );
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          stale.push(sub.endpoint);
        } else {
          console.warn("[push] falha ao enviar:", sub.endpoint, status ?? e);
        }
      }
    })
  );

  if (stale.length) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: stale } },
    });
  }
}
