"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, BadgeCheck, TrendingUp } from "lucide-react";
import { FeedShell } from "@/components/feed/FeedShell";
import { PostCard } from "@/components/feed/PostCard";
import { PostComposer } from "@/components/feed/PostComposer";
import { VerificationBanner } from "@/components/verification/VerificationBanner";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { toggleFollow } from "@/lib/actions";
import { formatCount } from "@/lib/feed";
import type { FeedPost, FeedTab, SessionUser, Suggestion, Trend } from "@/lib/types";

const BLUE = "#176a88";
const INK = "#0c2b36";
const LINE = "#e4ebee";

function FeedTabs({ tab }: { tab: FeedTab }) {
  const tabs: { id: FeedTab; label: string }[] = [
    { id: "forYou", label: "Para você" },
    { id: "following", label: "Seguindo" },
  ];

  return (
    <div className="flex border-b" style={{ borderColor: LINE }}>
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={`/feed?tab=${t.id}`}
          className="flex-1 py-3 text-center font-bold transition-colors"
          style={{
            fontSize: 15,
            color: tab === t.id ? INK : "#7a8f97",
            textDecoration: "none",
            borderBottom: tab === t.id ? `3px solid ${BLUE}` : "3px solid transparent",
          }}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

function SuggestionRow({ s, onToggle }: { s: Suggestion; onToggle: (id: string) => void }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5">
      <Avatar name={s.name} size={40} />
      <div className="flex-1 min-w-0 leading-tight">
        <div className="flex items-center gap-1">
          <span style={{ fontWeight: 700, fontSize: 14 }} className="truncate">{s.name}</span>
          {s.verified && <VerifiedBadge size={14} />}
        </div>
        <div style={{ fontSize: 13, color: "#7a8f97" }}>{s.spec}</div>
      </div>
      <button
        type="button"
        onClick={() => onToggle(s.id)}
        className="rounded-full px-4 py-1.5 font-bold"
        style={{
          fontSize: 13.5,
          background: s.following ? "transparent" : INK,
          color: s.following ? INK : "#fff",
          border: s.following ? `1px solid ${LINE}` : "none",
          cursor: "pointer",
        }}
      >
        {s.following ? "Seguindo" : "Seguir"}
      </button>
    </div>
  );
}

function RightRail({
  suggestions,
  trends,
  onFollow,
}: {
  suggestions: Suggestion[];
  trends: Trend[];
  onFollow: (id: string) => void;
}) {
  return (
    <>
      <Link
        href="/explore"
        className="flex items-center gap-2 px-4 py-2 rounded-full mb-4"
        style={{ background: "#eef3f5", color: "#7a8f97", textDecoration: "none" }}
      >
        <Search size={18} />
        <span style={{ fontSize: 14 }}>Buscar profissionais, temas…</span>
      </Link>

      <div className="rounded-2xl p-4 mb-4" style={{ background: "#eaf1f4" }}>
        <div className="flex items-center gap-2 mb-1">
          <BadgeCheck size={20} style={{ color: BLUE }} fill={BLUE} stroke="#fff" />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Selo verificado</span>
        </div>
        <p style={{ fontSize: 13.5, color: "#516b75", lineHeight: 1.5 }}>
          Todo perfil com selo teve o registro profissional confirmado.
        </p>
      </div>

      <div className="rounded-2xl mb-4" style={{ background: "#f4f7f8" }}>
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <TrendingUp size={18} style={{ color: "#e05930" }} />
          <h3 style={{ fontWeight: 800, fontSize: 16 }}>Em alta na saúde</h3>
        </div>
        {trends.map((t) => (
          <Link
            key={t.tag}
            href={`/explore/tag/${t.tag}`}
            className="block px-4 py-2.5"
            style={{ textDecoration: "none" }}
          >
            <div style={{ fontWeight: 700, fontSize: 14.5, color: INK }}>#{t.tag}</div>
            <div style={{ fontSize: 12.5, color: "#7a8f97" }}>
              {t.count > 0 ? `${formatCount(t.count)} publicações` : "Em alta"}
            </div>
          </Link>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className="rounded-2xl" style={{ background: "#f4f7f8" }}>
          <h3 className="px-4 pt-3 pb-1" style={{ fontWeight: 800, fontSize: 16 }}>Quem seguir</h3>
          {suggestions.map((s) => (
            <SuggestionRow key={s.id} s={s} onToggle={onFollow} />
          ))}
        </div>
      )}
    </>
  );
}

export function FeedClient({
  user,
  initialPosts,
  initialSuggestions,
  trends,
  notificationCount,
  tab,
}: {
  user: SessionUser;
  initialPosts: FeedPost[];
  initialSuggestions: Suggestion[];
  trends: Trend[];
  notificationCount: number;
  tab: FeedTab;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const onFollow = (id: string) => {
    startTransition(async () => {
      await toggleFollow(id);
      router.refresh();
    });
  };

  return (
    <FeedShell
      user={user}
      notificationCount={notificationCount}
      rightRail={
        <RightRail suggestions={initialSuggestions} trends={trends} onFollow={onFollow} />
      }
    >
      <main
        className="flex-1 min-w-0"
        style={{ borderRight: `1px solid ${LINE}`, maxWidth: 620, background: "#fff" }}
      >
        <div
          className="sticky top-0 z-10"
          style={{ background: "rgba(255,255,255,.95)", borderBottom: `1px solid ${LINE}` }}
        >
          <div className="px-4 py-3">
            <h1 style={{ fontWeight: 800, fontSize: 20 }}>Início</h1>
          </div>
          <FeedTabs tab={tab} />
        </div>

        <VerificationBanner user={user} />
        <PostComposer user={user} />

        {initialPosts.length === 0 ? (
          <p className="px-4 py-8 text-center" style={{ color: "#7a8f97" }}>
            {tab === "following"
              ? "Siga colegas para ver as publicações deles aqui."
              : "Nenhuma publicação ainda."}
          </p>
        ) : (
          initialPosts.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </main>
    </FeedShell>
  );
}
