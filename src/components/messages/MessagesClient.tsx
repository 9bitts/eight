"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FeedShell } from "@/components/feed/FeedShell";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { formatMessageTime, type ConversationPreview } from "@/lib/messages";
import type { MessageRequestPreview } from "@/lib/message-requests";
import {
  acceptMessageRequest,
  rejectMessageRequest,
} from "@/lib/actions/message-requests";
import type { SessionUser } from "@/lib/types";
import { useTransition } from "react";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const CARD = "var(--eight-card-bg)";
const MUTED = "var(--eight-muted)";
const BLUE = "#176a88";
const ORANGE = "#e05930";

function ConversationRow({ c }: { c: ConversationPreview }) {
  return (
    <Link
      href={`/messages/${c.id}`}
      className="flex gap-3 px-4 py-3 border-b"
      style={{
        borderColor: LINE,
        textDecoration: "none",
        background: c.unread ? "var(--eight-nav-active)" : CARD,
      }}
    >
      <Avatar name={c.otherName} size={48} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span style={{ fontWeight: 700, color: INK }}>{c.otherName}</span>
          {c.otherVerified && <VerifiedBadge size={14} />}
          {c.lastMessageAt && (
            <span className="ml-auto shrink-0" style={{ fontSize: 12, color: MUTED }}>
              {formatMessageTime(new Date(c.lastMessageAt))}
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: MUTED }}>@{c.otherHandle}</div>
        {c.lastMessage && (
          <p
            className="truncate mt-1"
            style={{ fontSize: 14, color: c.unread ? INK : MUTED, fontWeight: c.unread ? 600 : 400 }}
          >
            {c.lastMessage}
          </p>
        )}
      </div>
    </Link>
  );
}

function RequestRow({
  r,
  onAccept,
  onReject,
  pending,
}: {
  r: MessageRequestPreview;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  pending: boolean;
}) {
  return (
    <div className="px-4 py-3 border-b" style={{ borderColor: LINE, background: "var(--eight-nav-active)" }}>
      <div className="flex gap-3">
        <Avatar name={r.fromName} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <Link href={`/${r.fromHandle}`} style={{ fontWeight: 700, color: INK, textDecoration: "none" }}>
              {r.fromName}
            </Link>
            {r.fromVerified && <VerifiedBadge size={14} />}
          </div>
          <div style={{ fontSize: 13, color: MUTED }}>@{r.fromHandle}</div>
          <p style={{ fontSize: 14, color: INK, marginTop: 6, lineHeight: 1.45 }}>{r.body}</p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => onAccept(r.id)}
              className="rounded-full px-4 py-1.5 font-bold"
              style={{ fontSize: 13, border: "none", background: BLUE, color: "#fff", cursor: "pointer" }}
            >
              Aceitar
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => onReject(r.id)}
              className="rounded-full px-4 py-1.5 font-bold"
              style={{ fontSize: 13, border: `1px solid ${LINE}`, background: CARD, color: ORANGE, cursor: "pointer" }}
            >
              Recusar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessagesClient({
  user,
  notificationCount,
  conversations,
  requests,
  canMessage,
}: {
  user: SessionUser;
  notificationCount: number;
  conversations: ConversationPreview[];
  requests: MessageRequestPreview[];
  canMessage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(id);
  }, [router]);

  const onAccept = (id: string) => {
    startTransition(async () => {
      const { conversationId } = await acceptMessageRequest(id);
      router.push(`/messages/${conversationId}`);
    });
  };

  const onReject = (id: string) => {
    startTransition(async () => {
      await rejectMessageRequest(id);
      router.refresh();
    });
  };

  return (
    <FeedShell user={user} notificationCount={notificationCount}>
      <main className="flex-1 min-w-0" style={{ maxWidth: 620, background: CARD, borderRight: `1px solid ${LINE}` }}>
        <div className="sticky top-0 z-10 px-4 py-3" style={{ borderBottom: `1px solid ${LINE}`, background: "var(--eight-header-bg)" }}>
          <h1 style={{ fontWeight: 800, fontSize: 20, color: INK }}>Mensagens</h1>
          {!canMessage && (
            <p style={{ fontSize: 13, color: MUTED, marginTop: 6, lineHeight: 1.45 }}>
              Mensagens diretas ficam disponíveis após a verificação do seu selo profissional.
            </p>
          )}
          {canMessage && (
            <p style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>
              Converse com profissionais verificados. Sem seguimento mútuo, envie um pedido primeiro.
            </p>
          )}
        </div>

        {requests.length > 0 && (
          <section>
            <h2 className="px-4 py-2 font-bold" style={{ fontSize: 13, color: MUTED, borderBottom: `1px solid ${LINE}` }}>
              Pedidos de mensagem ({requests.length})
            </h2>
            {requests.map((r) => (
              <RequestRow key={r.id} r={r} onAccept={onAccept} onReject={onReject} pending={pending} />
            ))}
          </section>
        )}

        {conversations.length === 0 && requests.length === 0 ? (
          <p className="px-4 py-12 text-center" style={{ color: MUTED, lineHeight: 1.5 }}>
            {canMessage
              ? "Nenhuma conversa ainda. Visite o perfil de um colega verificado e toque em Mensagem."
              : "Complete sua verificação para enviar mensagens."}
          </p>
        ) : (
          conversations.map((c) => <ConversationRow key={c.id} c={c} />)
        )}
      </main>
    </FeedShell>
  );
}
