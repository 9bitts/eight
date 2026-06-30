"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FeedShell } from "@/components/feed/FeedShell";
import { PostCard } from "@/components/feed/PostCard";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { EightLogo } from "@/components/EightLogo";
import { removeFromList, updateList } from "@/lib/actions/lists";
import type { ListDetail } from "@/lib/lists";
import type { ConnectionProfile, FeedPost, SessionUser } from "@/lib/types";
import { ArrowLeft, Globe, Link2, Lock } from "lucide-react";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const MUTED = "var(--eight-muted)";
const CARD = "var(--eight-card-bg)";
const ORANGE = "#e05930";
const BLUE = "#176a88";

type Tab = "members" | "posts";

function ShareListButton({ listId }: { listId: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = `${window.location.origin}/listas/${listId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold"
      style={{ fontSize: 13, border: `1px solid ${LINE}`, background: CARD, color: BLUE, cursor: "pointer" }}
    >
      <Link2 size={14} />
      {copied ? "Link copiado!" : "Compartilhar"}
    </button>
  );
}

function ListMain({
  list,
  posts,
  tab,
  setTab,
  isOwner,
  pending,
  onRemove,
  onTogglePublic,
}: {
  list: ListDetail;
  posts: FeedPost[];
  tab: Tab;
  setTab: (t: Tab) => void;
  isOwner: boolean;
  pending: boolean;
  onRemove: (profileId: string) => void;
  onTogglePublic: () => void;
}) {
  return (
    <main
      className="flex-1 min-w-0"
      style={{ maxWidth: 620, background: CARD, borderRight: `1px solid ${LINE}` }}
    >
      <div
        className="sticky top-0 z-10"
        style={{ background: "var(--eight-header-bg)", borderBottom: `1px solid ${LINE}` }}
      >
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href={isOwner ? "/listas" : `/${list.owner.handle}`} style={{ color: INK }}>
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 style={{ fontWeight: 800, fontSize: 18, color: INK }}>{list.name}</h1>
              {list.isPublic ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ fontSize: 11, fontWeight: 700, background: "#e8f4f8", color: BLUE }}
                >
                  <Globe size={11} />
                  Pública
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ fontSize: 11, fontWeight: 700, background: "var(--eight-surface-subtle)", color: MUTED }}
                >
                  <Lock size={11} />
                  Privada
                </span>
              )}
            </div>
            {list.description && (
              <p style={{ color: MUTED, fontSize: 13 }}>{list.description}</p>
            )}
            {!isOwner && (
              <Link
                href={`/${list.owner.handle}`}
                style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}
              >
                por {list.owner.displayName}
                {list.owner.verified && " ✓"}
              </Link>
            )}
          </div>
          {list.isPublic && !isOwner && <ShareListButton listId={list.id} />}
        </div>

        {isOwner && (
          <div
            className="px-4 py-2 flex items-center justify-between gap-3 border-b"
            style={{ borderColor: LINE }}
          >
            <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 13, color: INK }}>
              <input
                type="checkbox"
                checked={list.isPublic}
                onChange={onTogglePublic}
                disabled={pending}
              />
              Tornar lista pública
            </label>
            {list.isPublic && <ShareListButton listId={list.id} />}
          </div>
        )}

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
          posts.map((post) => <PostCard key={post.id} post={post} trackImpression />)
        )
      ) : list.members.length === 0 ? (
        <p className="px-4 py-12 text-center" style={{ color: MUTED }}>
          {isOwner
            ? "Lista vazia. Adicione perfis pelo menu ··· no perfil de alguém."
            : "Esta lista ainda não tem membros."}
        </p>
      ) : (
        list.members.map((profile) => (
          <MemberRow
            key={profile.id}
            profile={profile}
            isOwner={isOwner}
            pending={pending}
            onRemove={onRemove}
          />
        ))
      )}
    </main>
  );
}

function MemberRow({
  profile,
  isOwner,
  pending,
  onRemove,
}: {
  profile: ConnectionProfile;
  isOwner: boolean;
  pending: boolean;
  onRemove: (id: string) => void;
}) {
  return (
    <div
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
      {isOwner && (
        <button
          type="button"
          onClick={() => onRemove(profile.id)}
          disabled={pending}
          className="rounded-full px-3 py-1.5 font-bold shrink-0"
          style={{ fontSize: 12, border: `1px solid ${LINE}`, background: CARD, color: ORANGE, cursor: "pointer" }}
        >
          Remover
        </button>
      )}
    </div>
  );
}

export function ListDetailClient({
  user,
  notificationCount = 0,
  list,
  posts,
  isOwner,
}: {
  user: SessionUser | null;
  notificationCount?: number;
  list: ListDetail;
  posts: FeedPost[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("posts");
  const [isPublic, setIsPublic] = useState(list.isPublic);
  const [pending, startTransition] = useTransition();

  const listWithPublic = { ...list, isPublic };

  const onRemove = (profileId: string) => {
    startTransition(async () => {
      await removeFromList(list.id, profileId);
      router.refresh();
    });
  };

  const onTogglePublic = () => {
    const next = !isPublic;
    setIsPublic(next);
    startTransition(async () => {
      try {
        await updateList(list.id, { isPublic: next });
        router.refresh();
      } catch {
        setIsPublic(!next);
      }
    });
  };

  const main = (
    <ListMain
      list={listWithPublic}
      posts={posts}
      tab={tab}
      setTab={setTab}
      isOwner={isOwner}
      pending={pending}
      onRemove={onRemove}
      onTogglePublic={onTogglePublic}
    />
  );

  if (user) {
    return (
      <FeedShell user={user} notificationCount={notificationCount}>
        {main}
      </FeedShell>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--eight-shell-bg)" }}>
      <header
        className="px-4 py-3 flex items-center justify-between border-b"
        style={{ borderColor: LINE, background: CARD }}
      >
        <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
          <EightLogo variant="icon" size={28} />
          <span style={{ fontWeight: 800, fontSize: 18, color: INK }}>eight</span>
        </Link>
        <Link
          href="/login"
          className="rounded-full px-4 py-2 font-bold text-white"
          style={{ background: BLUE, textDecoration: "none", fontSize: 14 }}
        >
          Entrar
        </Link>
      </header>
      <div className="flex justify-center flex-1">{main}</div>
    </div>
  );
}
