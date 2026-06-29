"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FeedShell } from "@/components/feed/FeedShell";
import { PostCard } from "@/components/feed/PostCard";
import { cancelScheduledPost } from "@/lib/actions";
import type { FeedPost, SessionUser } from "@/lib/types";
import { Clock } from "lucide-react";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const MUTED = "var(--eight-muted)";
const CARD = "var(--eight-card-bg)";
const ORANGE = "#e05930";

export function ScheduledClient({
  user,
  notificationCount,
  posts,
}: {
  user: SessionUser;
  notificationCount: number;
  posts: FeedPost[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onCancel = (postId: string) => {
    if (!confirm("Cancelar esta publicação agendada?")) return;
    startTransition(async () => {
      await cancelScheduledPost(postId);
      router.refresh();
    });
  };

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
          <h1 style={{ fontWeight: 800, fontSize: 18, color: INK }}>Posts agendados</h1>
          <p style={{ color: MUTED, fontSize: 13 }}>Publicações que ainda serão enviadas</p>
        </div>

        {posts.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Clock size={32} style={{ color: MUTED, margin: "0 auto 12px" }} />
            <p style={{ color: MUTED }}>Nenhum post agendado.</p>
            <Link href="/feed" style={{ color: "#176a88", fontWeight: 600, fontSize: 14 }}>
              Voltar ao feed →
            </Link>
          </div>
        ) : (
          posts.map((p) => (
            <div key={p.id}>
              <PostCard post={p} />
              <div className="px-4 pb-3 flex justify-end" style={{ borderBottom: `1px solid ${LINE}` }}>
                <button
                  type="button"
                  onClick={() => onCancel(p.id)}
                  disabled={pending}
                  className="rounded-full px-4 py-1.5 font-bold"
                  style={{
                    fontSize: 13,
                    border: `1px solid ${LINE}`,
                    background: CARD,
                    color: ORANGE,
                    cursor: "pointer",
                  }}
                >
                  Cancelar agendamento
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </FeedShell>
  );
}
