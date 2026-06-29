"use client";

import Link from "next/link";
import { FeedShell } from "@/components/feed/FeedShell";
import { PostCard } from "@/components/feed/PostCard";
import type { FeedPost, SessionUser } from "@/lib/types";
import { Bookmark } from "lucide-react";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const MUTED = "var(--eight-muted)";
const CARD = "var(--eight-card-bg)";

export function SavedClient({
  user,
  notificationCount,
  posts,
}: {
  user: SessionUser;
  notificationCount: number;
  posts: FeedPost[];
}) {
  return (
    <FeedShell user={user} notificationCount={notificationCount}>
      <main
        className="flex-1 min-w-0"
        style={{ maxWidth: 620, background: CARD, borderRight: `1px solid ${LINE}` }}
      >
        <div
          className="sticky top-0 z-10 px-4 py-3"
          style={{ background: "var(--eight-header-bg)", borderBottom: `1px solid ${LINE}` }}
        >
          <h1 style={{ fontWeight: 800, fontSize: 18, color: INK }}>Salvos</h1>
          <p style={{ color: MUTED, fontSize: 13 }}>Publicações que você guardou</p>
        </div>

        {posts.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Bookmark size={32} style={{ color: MUTED, margin: "0 auto 12px" }} />
            <p style={{ color: MUTED }}>Nenhuma publicação salva ainda.</p>
            <Link href="/feed" style={{ color: "#176a88", fontWeight: 600, fontSize: 14 }}>
              Explorar o feed →
            </Link>
          </div>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </main>
    </FeedShell>
  );
}
