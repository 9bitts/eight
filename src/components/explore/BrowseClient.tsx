"use client";

import Link from "next/link";
import { FeedShell } from "@/components/feed/FeedShell";
import { ConnectionRow } from "@/components/connections/ConnectionRow";
import { formatCount } from "@/lib/feed";
import type { ConnectionProfile, SessionUser } from "@/lib/types";

const INK = "#0c2b36";
const LINE = "#e4ebee";
const BLUE = "#176a88";

export function BrowseClient({
  user,
  notificationCount,
  title,
  subtitle,
  count,
  profiles,
  backHref = "/explore",
}: {
  user: SessionUser;
  notificationCount: number;
  title: string;
  subtitle?: string;
  count: number;
  profiles: ConnectionProfile[];
  backHref?: string;
}) {
  return (
    <FeedShell user={user} notificationCount={notificationCount}>
      <main className="flex-1 min-w-0" style={{ maxWidth: 620, background: "#fff", borderRight: `1px solid ${LINE}` }}>
        <div className="sticky top-0 z-10 px-4 py-3" style={{ borderBottom: `1px solid ${LINE}`, background: "#fff" }}>
          <Link href={backHref} style={{ fontSize: 13, color: BLUE, textDecoration: "none" }}>
            ← Explorar
          </Link>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: INK, marginTop: 4 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 14, color: "#7a8f97", marginTop: 2 }}>{subtitle}</p>}
          <p style={{ fontSize: 13, color: "#9fb0b6", marginTop: 4 }}>
            {formatCount(count)} profissiona{count !== 1 ? "is" : "l"}
          </p>
        </div>

        {profiles.length === 0 ? (
          <p className="px-4 py-12 text-center" style={{ color: "#7a8f97" }}>
            Nenhum profissional encontrado ainda.
          </p>
        ) : (
          profiles.map((p) => <ConnectionRow key={p.id} profile={p} showFollowsYou />)
        )}
      </main>
    </FeedShell>
  );
}
