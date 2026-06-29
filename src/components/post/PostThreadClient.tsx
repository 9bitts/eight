"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FeedShell } from "@/components/feed/FeedShell";
import { PostCard } from "@/components/feed/PostCard";
import { Avatar } from "@/components/Avatar";
import { createPost } from "@/lib/actions";
import type { FeedPost, SessionUser } from "@/lib/types";

const BLUE = "#176a88";
const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const CARD = "var(--eight-card-bg)";

export function PostThreadClient({
  posts,
  replies,
  user,
  notificationCount,
  focusPostId,
}: {
  posts: FeedPost[];
  replies: FeedPost[];
  user: SessionUser;
  notificationCount: number;
  focusPostId: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  const root = posts[0];
  if (!root) return null;

  const reply = () => {
    if (!draft.trim() || pending) return;
    startTransition(async () => {
      await createPost({ body: draft, parentId: root.id });
      setDraft("");
      router.refresh();
    });
  };

  return (
    <FeedShell user={user} notificationCount={notificationCount}>
      <main className="flex-1 min-w-0" style={{ maxWidth: 620, background: CARD, borderRight: `1px solid ${LINE}` }}>
        <div
          className="sticky top-0 z-10 px-4 py-3 flex items-center gap-4"
          style={{ background: "rgba(255,255,255,.92)", borderBottom: `1px solid ${LINE}` }}
        >
          <Link href="/feed" style={{ color: INK }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ fontWeight: 800, fontSize: 18 }}>
            {posts.length > 1 ? "Fio" : "Publicação"}
          </h1>
        </div>

        {posts.map((p) => (
          <div key={p.id} style={p.id === focusPostId ? { background: "#fafcfd" } : undefined}>
            <PostCard post={p} showActions={p.id === root.id} />
          </div>
        ))}

        <div className="flex gap-3 px-4 py-4 border-b" style={{ borderColor: LINE }}>
          <Avatar name={user.displayName} />
          <div className="flex-1">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Responder…"
              rows={2}
              maxLength={500}
              className="w-full resize-none outline-none"
              style={{ fontSize: 16, color: INK, background: "transparent" }}
            />
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={reply}
                disabled={!draft.trim() || pending}
                className="rounded-full px-5 py-2 font-bold"
                style={{
                  background: BLUE,
                  color: "#fff",
                  fontSize: 14,
                  opacity: draft.trim() && !pending ? 1 : 0.4,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {pending ? "Enviando…" : "Responder"}
              </button>
            </div>
          </div>
        </div>

        {replies.map((r) => (
          <PostCard key={r.id} post={r} />
        ))}
      </main>
    </FeedShell>
  );
}
