"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FeedShell } from "@/components/feed/FeedShell";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { formatMessageTime, type ConversationPreview } from "@/lib/messages";
import type { SessionUser } from "@/lib/types";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const CARD = "var(--eight-card-bg)";
const MUTED = "var(--eight-muted)";

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

export function MessagesClient({
  user,
  notificationCount,
  conversations,
  canMessage,
}: {
  user: SessionUser;
  notificationCount: number;
  conversations: ConversationPreview[];
  canMessage: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(id);
  }, [router]);

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
              Converse com profissionais verificados. Abra uma conversa pelo perfil de um colega.
            </p>
          )}
        </div>

        {conversations.length === 0 ? (
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
