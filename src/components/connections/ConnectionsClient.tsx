"use client";

import Link from "next/link";
import { FeedShell } from "@/components/feed/FeedShell";
import { ConnectionRow } from "@/components/connections/ConnectionRow";
import type { ConnectionProfile, SessionUser } from "@/lib/types";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const CARD = "var(--eight-card-bg)";
const MUTED = "var(--eight-muted)";

type Tab = "followers" | "following";

export function ConnectionsClient({
  user,
  notificationCount,
  profileHandle,
  profileName,
  tab,
  connections,
}: {
  user: SessionUser;
  notificationCount: number;
  profileHandle: string;
  profileName: string;
  tab: Tab;
  connections: ConnectionProfile[];
}) {
  const title = tab === "followers" ? "Seguidores" : "Seguindo";

  return (
    <FeedShell user={user} notificationCount={notificationCount}>
      <main className="flex-1 min-w-0" style={{ maxWidth: 620, background: CARD, borderRight: `1px solid ${LINE}` }}>
        <div className="sticky top-0 z-10" style={{ borderBottom: `1px solid ${LINE}`, background: "var(--eight-header-bg)" }}>
          <div className="px-4 py-3">
            <Link href={`/${profileHandle}`} style={{ fontSize: 13, color: "#176a88", textDecoration: "none" }}>
              ← @{profileHandle}
            </Link>
            <h1 style={{ fontWeight: 800, fontSize: 20, color: INK, marginTop: 4 }}>{title}</h1>
            <p style={{ fontSize: 13, color: MUTED }}>{profileName}</p>
          </div>
          <div className="flex">
            <Link
              href={`/${profileHandle}/followers`}
              className="flex-1 py-3 text-center font-bold"
              style={{
                textDecoration: "none",
                color: tab === "followers" ? INK : MUTED,
                borderBottom: tab === "followers" ? "3px solid #176a88" : "3px solid transparent",
              }}
            >
              Seguidores
            </Link>
            <Link
              href={`/${profileHandle}/following`}
              className="flex-1 py-3 text-center font-bold"
              style={{
                textDecoration: "none",
                color: tab === "following" ? INK : MUTED,
                borderBottom: tab === "following" ? "3px solid #176a88" : "3px solid transparent",
              }}
            >
              Seguindo
            </Link>
          </div>
        </div>

        {connections.length === 0 ? (
          <p className="px-4 py-12 text-center" style={{ color: MUTED }}>
            {tab === "followers" ? "Nenhum seguidor ainda." : "Não segue ninguém ainda."}
          </p>
        ) : (
          connections.map((c) => (
            <ConnectionRow key={c.id} profile={c} showFollowsYou={tab === "followers"} />
          ))
        )}
      </main>
    </FeedShell>
  );
}
