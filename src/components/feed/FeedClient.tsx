"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, BadgeCheck, TrendingUp, Globe, Image as ImageIcon, Sparkles } from "lucide-react";
import { FeedShell } from "@/components/feed/FeedShell";
import { PostCard } from "@/components/feed/PostCard";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { createPost, toggleFollow } from "@/lib/actions";
import type { FeedPost, SessionUser, Suggestion } from "@/lib/types";

const BLUE = "#176a88";
const INK = "#0c2b36";
const LINE = "#e4ebee";

const TRENDS = [
  { tag: "#InsuficiênciaCardíaca", posts: "Em alta" },
  { tag: "#Telemedicina", posts: "Em alta" },
  { tag: "#MedLusófona", posts: "Em alta" },
  { tag: "#SaúdeDigital", posts: "Em alta" },
];

function SuggestionRow({
  s,
  onToggle,
}: {
  s: Suggestion;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5">
      <Avatar name={s.name} size={40} />
      <div className="flex-1 min-w-0 leading-tight">
        <div className="flex items-center gap-1">
          <span style={{ fontWeight: 700, fontSize: 14 }} className="truncate">
            {s.name}
          </span>
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
  onFollow,
}: {
  suggestions: Suggestion[];
  onFollow: (id: string) => void;
}) {
  return (
    <>
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full mb-4"
        style={{ background: "#eef3f5", color: "#7a8f97" }}
      >
        <Search size={18} />
        <span style={{ fontSize: 14 }}>Buscar profissionais, temas…</span>
      </div>

      <div className="rounded-2xl p-4 mb-4" style={{ background: "#eaf1f4" }}>
        <div className="flex items-center gap-2 mb-1">
          <BadgeCheck size={20} style={{ color: BLUE }} fill={BLUE} stroke="#fff" />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Selo verificado</span>
        </div>
        <p style={{ fontSize: 13.5, color: "#516b75", lineHeight: 1.5 }}>
          Todo perfil com selo teve o registro profissional confirmado. Aqui você sabe com quem está falando.
        </p>
      </div>

      <div className="rounded-2xl mb-4" style={{ background: "#f4f7f8" }}>
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <TrendingUp size={18} style={{ color: "#e05930" }} />
          <h3 style={{ fontWeight: 800, fontSize: 16 }}>Em alta na saúde</h3>
        </div>
        {TRENDS.map((t) => (
          <div key={t.tag} className="px-4 py-2.5">
            <div style={{ fontWeight: 700, fontSize: 14.5, color: INK }}>{t.tag}</div>
            <div style={{ fontSize: 12.5, color: "#7a8f97" }}>{t.posts}</div>
          </div>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className="rounded-2xl" style={{ background: "#f4f7f8" }}>
          <h3 className="px-4 pt-3 pb-1" style={{ fontWeight: 800, fontSize: 16 }}>
            Quem seguir
          </h3>
          {suggestions.map((s) => (
            <SuggestionRow key={s.id} s={s} onToggle={onFollow} />
          ))}
        </div>
      )}

      <p className="px-4 mt-4" style={{ fontSize: 12, color: "#9fb0b6", lineHeight: 1.5 }}>
        eight · doctor8.com.br · pt · en · es
      </p>
    </>
  );
}

export function FeedClient({
  user,
  initialPosts,
  initialSuggestions,
  notificationCount,
}: {
  user: SessionUser;
  initialPosts: FeedPost[];
  initialSuggestions: Suggestion[];
  notificationCount: number;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [pending, startTransition] = useTransition();

  const publish = () => {
    if (!draft.trim() || pending) return;
    startTransition(async () => {
      await createPost(draft);
      setDraft("");
      router.refresh();
    });
  };

  const onFollow = (id: string) => {
    startTransition(async () => {
      await toggleFollow(id);
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, following: !s.following } : s))
      );
      router.refresh();
    });
  };

  return (
    <FeedShell
      user={user}
      notificationCount={notificationCount}
      rightRail={<RightRail suggestions={suggestions} onFollow={onFollow} />}
    >
      <main
        className="flex-1 min-w-0"
        style={{ borderRight: `1px solid ${LINE}`, maxWidth: 620, background: "#fff" }}
      >
        <div
          className="sticky top-0 z-10 px-4 py-3"
          style={{ background: "rgba(255,255,255,.9)", borderBottom: `1px solid ${LINE}` }}
        >
          <h1 style={{ fontWeight: 800, fontSize: 20 }}>Início</h1>
          <p style={{ color: "#7a8f97", fontSize: 13 }}>A rede dos profissionais de saúde</p>
        </div>

        <div className="flex gap-3 px-4 py-4 border-b" style={{ borderColor: LINE }}>
          <Avatar name={user.displayName} />
          <div className="flex-1">
            <textarea
              id="composer"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="O que você está acompanhando na sua prática?"
              rows={2}
              maxLength={500}
              className="w-full resize-none outline-none"
              style={{ fontSize: 17, color: INK, background: "transparent", lineHeight: 1.4 }}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-1" style={{ color: BLUE }}>
                <ImageIcon size={20} />
                <Sparkles size={20} />
                <Globe size={20} />
              </div>
              <button
                type="button"
                onClick={publish}
                disabled={!draft.trim() || pending}
                className="rounded-full px-5 py-2 font-bold"
                style={{
                  background: BLUE,
                  color: "#fff",
                  fontSize: 14.5,
                  opacity: draft.trim() && !pending ? 1 : 0.4,
                  border: "none",
                  cursor: draft.trim() && !pending ? "pointer" : "not-allowed",
                }}
              >
                {pending ? "Publicando…" : "Publicar"}
              </button>
            </div>
          </div>
        </div>

        {initialPosts.length === 0 ? (
          <p className="px-4 py-8 text-center" style={{ color: "#7a8f97" }}>
            Nenhuma publicação ainda. Siga colegas ou publique o primeiro post.
          </p>
        ) : (
          initialPosts.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </main>
    </FeedShell>
  );
}
