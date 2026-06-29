"use client";

import Link from "next/link";
import { FeedShell } from "@/components/feed/FeedShell";
import { ConnectionRow } from "@/components/connections/ConnectionRow";
import type { ConnectionProfile, SessionUser } from "@/lib/types";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const MUTED = "var(--eight-muted)";
const CARD = "var(--eight-card-bg)";

type Tab = "curtidas" | "reposts";

export function PostEngagementClient({
  user,
  notificationCount,
  postId,
  tab,
  connections,
}: {
  user: SessionUser;
  notificationCount: number;
  postId: string;
  tab: Tab;
  connections: ConnectionProfile[];
}) {
  const title = tab === "curtidas" ? "Curtidas" : "Reposts";

  return (
    <FeedShell user={user} notificationCount={notificationCount}>
      <main className="flex-1 min-w-0" style={{ maxWidth: 620, background: CARD, borderRight: `1px solid ${LINE}` }}>
        <div className="sticky top-0 z-10" style={{ borderBottom: `1px solid ${LINE}`, background: "var(--eight-header-bg)" }}>
          <div className="px-4 py-3">
            <Link href={`/post/${postId}`} style={{ fontSize: 13, color: "#176a88", textDecoration: "none" }}>
              ← Publicação
            </Link>
            <h1 style={{ fontWeight: 800, fontSize: 20, color: INK, marginTop: 4 }}>{title}</h1>
          </div>
          <div className="flex">
            <Link
              href={`/post/${postId}/curtidas`}
              className="flex-1 py-3 text-center font-bold"
              style={{
                textDecoration: "none",
                color: tab === "curtidas" ? INK : MUTED,
                borderBottom: tab === "curtidas" ? "3px solid #176a88" : "3px solid transparent",
              }}
            >
              Curtidas
            </Link>
            <Link
              href={`/post/${postId}/reposts`}
              className="flex-1 py-3 text-center font-bold"
              style={{
                textDecoration: "none",
                color: tab === "reposts" ? INK : MUTED,
                borderBottom: tab === "reposts" ? "3px solid #176a88" : "3px solid transparent",
              }}
            >
              Reposts
            </Link>
          </div>
        </div>

        {connections.length === 0 ? (
          <p className="px-4 py-12 text-center" style={{ color: MUTED }}>
            {tab === "curtidas" ? "Nenhuma curtida ainda." : "Nenhum repost ainda."}
          </p>
        ) : (
          connections.map((c) => <ConnectionRow key={c.id} profile={c} />)
        )}
      </main>
    </FeedShell>
  );
}
