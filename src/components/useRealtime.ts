"use client";

import { useEffect } from "react";
import { BADGE_POLL_INTERVAL_MS } from "@/lib/constants";

type RealtimePayload = {
  connected?: boolean;
  notifications?: number;
  messages?: number;
  messagesUpdated?: boolean;
};

export function useRealtimeBadges(
  onUpdate: (data: RealtimePayload) => void,
  conversationId?: string
) {
  useEffect(() => {
    let es: EventSource | null = null;
    let pollId: ReturnType<typeof setInterval> | null = null;
    let closed = false;

    const url = conversationId
      ? `/api/events/stream?conversation=${conversationId}`
      : "/api/events/stream";

    const startPolling = () => {
      if (pollId) return;
      const load = async () => {
        try {
          const [nRes, mRes] = await Promise.all([
            fetch("/api/notifications/unread-count"),
            fetch("/api/messages/unread-count"),
          ]);
          const nData = await nRes.json();
          const mData = await mRes.json();
          onUpdate({
            notifications: typeof nData.count === "number" ? nData.count : 0,
            messages: typeof mData.count === "number" ? mData.count : 0,
          });
        } catch {
          /* silencioso */
        }
      };
      load();
      pollId = setInterval(load, BADGE_POLL_INTERVAL_MS);
    };

    const connect = () => {
      if (closed) return;
      es = new EventSource(url);
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as RealtimePayload;
          if (data.connected) return;
          onUpdate(data);
        } catch {
          /* ignorar */
        }
      };
      es.onerror = () => {
        es?.close();
        es = null;
        startPolling();
      };
    };

    connect();

    return () => {
      closed = true;
      es?.close();
      if (pollId) clearInterval(pollId);
    };
  }, [conversationId, onUpdate]);
}
