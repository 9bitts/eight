"use client";

import Link from "next/link";
import { Heart, Repeat2, UserPlus, MessageCircle, BadgeCheck, Mail } from "lucide-react";
import { FeedShell } from "@/components/feed/FeedShell";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { timeAgo } from "@/lib/format";
import type { SessionUser } from "@/lib/types";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const CARD = "var(--eight-card-bg)";
const MUTED = "var(--eight-muted)";
const BLUE = "#176a88";

type Notif = {
  id: string;
  type: string;
  read: boolean;
  createdAt: Date;
  postId: string | null;
  actor: {
    displayName: string;
    handle: string;
    verified: boolean;
  };
};

function NotifIcon({ type }: { type: string }) {
  const props = { size: 18, style: { color: BLUE } };
  if (type === "LIKE") return <Heart {...props} fill={BLUE} />;
  if (type === "REPOST") return <Repeat2 {...props} />;
  if (type === "FOLLOW") return <UserPlus {...props} />;
  if (type === "VERIFICATION_APPROVED" || type === "VERIFICATION_REJECTED") {
    return <BadgeCheck {...props} />;
  }
  if (type === "MESSAGE") return <Mail {...props} />;
  return <MessageCircle {...props} />;
}

function notifText(n: Notif): string {
  const name = n.actor.displayName;
  switch (n.type) {
    case "LIKE":
      return `${name} curtiu sua publicação`;
    case "REPOST":
      return `${name} repostou sua publicação`;
    case "FOLLOW":
      return `${name} começou a seguir você`;
    case "REPLY":
      return `${name} respondeu sua publicação`;
    case "MENTION":
      return `${name} mencionou você`;
    case "VERIFICATION_APPROVED":
      return "Seu registro profissional foi aprovado — selo verificado liberado!";
    case "VERIFICATION_REJECTED":
      return "Sua verificação precisa de ajustes — veja em Verificação";
    case "MESSAGE":
      return `${name} enviou uma mensagem`;
    default:
      return `${name} interagiu com você`;
  }
}

function NotifRow({ n }: { n: Notif }) {
  const href =
    n.type === "VERIFICATION_APPROVED" || n.type === "VERIFICATION_REJECTED"
      ? "/verificacao"
      : n.type === "MESSAGE"
        ? "/messages"
        : n.postId
        ? `/post/${n.postId}`
        : `/${n.actor.handle}`;
  return (
    <Link
      href={href}
      className="flex gap-3 px-4 py-4 border-b"
      style={{
        borderColor: LINE,
        textDecoration: "none",
        background: n.read ? CARD : "var(--eight-nav-active)",
      }}
    >
      <NotifIcon type={n.type} />
      <Avatar name={n.actor.displayName} size={40} />
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: 15, color: INK, lineHeight: 1.4 }}>
          {notifText(n)}
          {n.actor.verified && (
            <span style={{ marginLeft: 4, verticalAlign: "middle" }}>
              <VerifiedBadge size={14} />
            </span>
          )}
        </p>
        <p style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{timeAgo(new Date(n.createdAt))}</p>
      </div>
    </Link>
  );
}

export function NotificationsClient({
  user,
  notifications,
  notificationCount,
}: {
  user: SessionUser;
  notifications: Notif[];
  notificationCount: number;
}) {
  return (
    <FeedShell user={user} notificationCount={notificationCount}>
      <main className="flex-1 min-w-0" style={{ maxWidth: 620, background: CARD, borderRight: `1px solid ${LINE}` }}>
        <div className="sticky top-0 z-10 px-4 py-3" style={{ borderBottom: `1px solid ${LINE}`, background: "var(--eight-header-bg)" }}>
          <h1 style={{ fontWeight: 800, fontSize: 20 }}>Notificações</h1>
        </div>
        {notifications.length === 0 ? (
          <p className="px-4 py-12 text-center" style={{ color: MUTED }}>
            Nenhuma notificação por enquanto.
          </p>
        ) : (
          notifications.map((n) => <NotifRow key={n.id} n={n} />)
        )}
      </main>
    </FeedShell>
  );
}
