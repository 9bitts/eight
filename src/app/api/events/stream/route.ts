export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { SSE_POLL_INTERVAL_MS } from "@/lib/constants";
import { getUnreadNotificationCount } from "@/lib/feed";
import { getUnreadMessageCount } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { acquireSseConnection, releaseSseConnection } from "@/lib/sse-connections";

/** Mesma checagem de participação que sendDirectMessage (conversationId_profileId). */
async function isConversationParticipant(
  conversationId: string,
  profileId: string
): Promise<boolean> {
  const row = await prisma.conversationParticipant.findUnique({
    where: { conversationId_profileId: { conversationId, profileId } },
    select: { id: true },
  });
  return row !== null;
}

export async function GET(req: Request) {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) {
    return new Response("Não autorizado", { status: 401 });
  }

  const conversationId =
    new URL(req.url).searchParams.get("conversation")?.trim() || null;

  if (conversationId) {
    const allowed = await isConversationParticipant(conversationId, profileId);
    if (!allowed) {
      return new Response(null, { status: 404 });
    }
  }

  if (!acquireSseConnection(profileId)) {
    return new Response("Muitas conexões simultâneas", { status: 429 });
  }

  const encoder = new TextEncoder();
  let lastNotif = -1;
  let lastMsg = -1;
  let lastMessageId: string | null | undefined = undefined;
  let closed = false;
  let interval: ReturnType<typeof setInterval> | null = null;

  const cleanup = () => {
    if (closed) return;
    closed = true;
    if (interval !== null) {
      clearInterval(interval);
      interval = null;
    }
    releaseSseConnection(profileId);
  };

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const tick = async () => {
        if (closed) return;
        try {
          const [notifCount, msgCount] = await Promise.all([
            getUnreadNotificationCount(profileId),
            getUnreadMessageCount(profileId),
          ]);

          let messagesUpdated = false;
          if (conversationId) {
            const latest = await prisma.directMessage.findFirst({
              where: { conversationId },
              orderBy: { createdAt: "desc" },
              select: { id: true },
            });
            const latestId = latest?.id ?? null;
            if (lastMessageId !== undefined && latestId !== lastMessageId) {
              messagesUpdated = true;
            }
            lastMessageId = latestId;
          }

          if (
            notifCount !== lastNotif ||
            msgCount !== lastMsg ||
            messagesUpdated
          ) {
            lastNotif = notifCount;
            lastMsg = msgCount;
            send({ notifications: notifCount, messages: msgCount, messagesUpdated });
          }
        } catch {
          send({ error: true });
        }
      };

      send({ connected: true });
      tick();
      interval = setInterval(tick, SSE_POLL_INTERVAL_MS);

      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          /* já fechado */
        }
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
