"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FeedShell } from "@/components/feed/FeedShell";
import { PostCard } from "@/components/feed/PostCard";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { removeFromList } from "@/lib/actions/lists";
import type { ConnectionProfile, FeedPost, SessionUser } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const MUTED = "var(--eight-muted)";
const CARD = "var(--eight-card-bg)";
const ORANGE = "#e05930";
const BLUE = "#176a88";

type Tab = "members" | "posts";

export function ListDetailClient({
  user,
  notificationCount,
  list,
  posts,
}: {
  user: SessionUser;
  notificationCount: number;
  list: {
    id: string;
    name: string;
    description: string | null;
    members: ConnectionProfile[];
  };
  posts: FeedPost[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("posts");
  const [pending, startTransition] = useTransition();

  const onRemove = (profileId: string) => {
    startTransition(async () => {
      await removeFromList(list.id, profileId);
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
          className="sticky top-0 z-10"
          style={{ background: "var(--eight-header-bg)", borderBottom: `1px solid ${LINE}` }}
        >
          <div className="px-4 py-3 flex items-center gap-3">
            <Link href="/listas" style={{ color: INK }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: 18, color: INK }}>{list.name}</h1>
              {list.description && (
                <p style={{ color: MUTED, fontSize: 13 }}>{list.description}</p>
              )}
            </div>
          </div>
          <div className="flex">
            <button
              type="button"
              onClick={() => setTab("posts")}
              className="flex-1 py-3 text-center font-bold"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: tab === "posts" ? INK : MUTED,
                borderBottom: tab === "posts" ? `3px solid ${BLUE}` : "3px solid transparent",
              }}
            >
              Publicações
            </button>
            <button
              type="button"
              onClick={() => setTab("members")}
              className="flex-1 py-3 text-center font-bold"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: tab === "members" ? INK : MUTED,
                borderBottom: tab === "members" ? `3px solid ${BLUE}` : "3px solid transparent",
              }}
            >
              Membros ({list.members.length})
            </button>
          </div>
        </div>

        {tab === "posts" ? (
          posts.length === 0 ? (
            <p className="px-4 py-12 text-center" style={{ color: MUTED }}>
              {list.members.length === 0
                ? "Adicione membros à lista para ver publicações."
                : "Nenhuma publicação recente dos membros desta lista."}
            </p>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )
        ) : list.members.length === 0 ? (
          <p className="px-4 py-12 text-center" style={{ color: MUTED }}>
            Lista vazia. Adicione perfis pelo menu ··· no perfil de alguém.
          </p>
        ) : (
          list.members.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center gap-3 px-4 py-3 border-b"
              style={{ borderColor: LINE }}
            >
              <Link href={`/${profile.handle}`}>
                <Avatar name={profile.displayName} size={48} />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <Link
                    href={`/${profile.handle}`}
                    style={{ fontWeight: 700, color: INK, textDecoration: "none" }}
                  >
                    {profile.displayName}
                  </Link>
                  {profile.verified && <VerifiedBadge size={15} />}
                </div>
                <div style={{ color: MUTED, fontSize: 14 }}>@{profile.handle}</div>
                {profile.spec && (
                  <div style={{ color: ORANGE, fontSize: 13, fontWeight: 600 }}>{profile.spec}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(profile.id)}
                disabled={pending}
                className="rounded-full px-3 py-1.5 font-bold shrink-0"
                style={{ fontSize: 12, border: `1px solid ${LINE}`, background: CARD, color: ORANGE, cursor: "pointer" }}
              >
                Remover
              </button>
            </div>
          ))
        )}
      </main>
    </FeedShell>
  );
}
