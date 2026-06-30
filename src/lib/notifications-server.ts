import { prisma } from "@/lib/prisma";
import { sendActivityEmail } from "@/lib/email";
import { sendPushToProfile } from "@/lib/push";

type NotifyType = "LIKE" | "REPOST" | "FOLLOW" | "REPLY" | "MENTION" | "MESSAGE";

type NotifyOptions = {
  conversationId?: string;
  groupName?: string;
  bodyOverride?: string;
};

const PREF_FIELD: Record<
  NotifyType,
  "notifyLike" | "notifyRepost" | "notifyFollow" | "notifyReply" | "notifyMention" | "notifyMessage"
> = {
  LIKE: "notifyLike",
  REPOST: "notifyRepost",
  FOLLOW: "notifyFollow",
  REPLY: "notifyReply",
  MENTION: "notifyMention",
  MESSAGE: "notifyMessage",
};

function siteUrl() {
  return (
    process.env.AUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://doctor8.com.br"
  ).replace(/\/$/, "");
}

function notificationText(
  type: NotifyType,
  actorName: string,
  options?: NotifyOptions
): string {
  if (options?.bodyOverride) return options.bodyOverride;
  if (type === "MESSAGE" && options?.groupName) {
    return `${actorName} enviou uma mensagem no grupo ${options.groupName}`;
  }
  switch (type) {
    case "LIKE":
      return `${actorName} curtiu sua publicação`;
    case "REPOST":
      return `${actorName} repostou sua publicação`;
    case "FOLLOW":
      return `${actorName} começou a seguir você`;
    case "REPLY":
      return `${actorName} respondeu sua publicação`;
    case "MENTION":
      return `${actorName} mencionou você`;
    case "MESSAGE":
      return `${actorName} enviou uma mensagem`;
    default:
      return `${actorName} interagiu com você`;
  }
}

function notificationUrl(
  type: NotifyType,
  actorHandle: string,
  postId?: string,
  options?: NotifyOptions
): string {
  const base = siteUrl();
  if (type === "MESSAGE" && options?.conversationId) {
    return `${base}/messages/${options.conversationId}`;
  }
  if (type === "MESSAGE") return `${base}/messages`;
  if (postId) return `${base}/post/${postId}`;
  return `${base}/${actorHandle}`;
}

async function deliverExternalNotifications(
  recipientId: string,
  actorId: string,
  type: NotifyType,
  postId?: string,
  options?: NotifyOptions
) {
  const [recipient, actor] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: recipientId },
      select: {
        notifyEmail: true,
        user: { select: { email: true } },
      },
    }),
    prisma.profile.findUnique({
      where: { id: actorId },
      select: { displayName: true, handle: true },
    }),
  ]);
  if (!actor) return;

  const body = notificationText(type, actor.displayName, options);
  const url = notificationUrl(type, actor.handle, postId, options);

  await sendPushToProfile(recipientId, { title: "eight", body, url });

  if (recipient?.notifyEmail && recipient.user.email) {
    await sendActivityEmail(recipient.user.email, body, url);
  }
}

export async function createNotificationIfAllowed(
  recipientId: string,
  actorId: string,
  type: NotifyType,
  postId?: string,
  options?: NotifyOptions
) {
  if (recipientId === actorId) return;

  const profile = await prisma.profile.findUnique({
    where: { id: recipientId },
    select: {
      notifyLike: true,
      notifyRepost: true,
      notifyFollow: true,
      notifyReply: true,
      notifyMention: true,
      notifyMessage: true,
    },
  });
  if (!profile) return;

  const field = PREF_FIELD[type];
  if (!profile[field]) return;

  await prisma.notification.create({
    data: { recipientId, actorId, type, postId: postId ?? null },
  });

  void deliverExternalNotifications(recipientId, actorId, type, postId, options).catch((e) => {
    console.warn("[notifications] external delivery failed:", e);
  });
}
