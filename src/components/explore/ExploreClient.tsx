"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { FeedShell } from "@/components/feed/FeedShell";
import { PostCard } from "@/components/feed/PostCard";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { formatSpec } from "@/lib/format";
import type { FeedPost, SessionUser } from "@/lib/types";

const INK = "#0c2b36";
const LINE = "#e4ebee";
const BLUE = "#176a88";

type ProfileResult = {
  id: string;
  displayName: string;
  handle: string;
  specialty: string | null;
  registrationType: string | null;
  registrationNumber: string | null;
  verified: boolean;
  location: string | null;
};

function ProfileResultRow({ p }: { p: ProfileResult }) {
  const spec = formatSpec(p.specialty, p.registrationType, p.registrationNumber);
  return (
    <Link
      href={`/${p.handle}`}
      className="flex gap-3 px-4 py-3 border-b"
      style={{ borderColor: LINE, textDecoration: "none" }}
    >
      <Avatar name={p.displayName} size={48} />
      <div>
        <div className="flex items-center gap-1">
          <span style={{ fontWeight: 700, color: INK }}>{p.displayName}</span>
          {p.verified && <VerifiedBadge size={15} />}
        </div>
        <div style={{ color: "#7a8f97", fontSize: 14 }}>@{p.handle}</div>
        <div style={{ color: BLUE, fontSize: 13, marginTop: 2 }}>{spec}</div>
        {p.location && <div style={{ color: "#9fb0b6", fontSize: 12 }}>{p.location}</div>}
      </div>
    </Link>
  );
}

export function ExploreClient({
  user,
  notificationCount,
}: {
  user: SessionUser;
  notificationCount: number;
}) {
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<ProfileResult[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [searched, setSearched] = useState(false);
  const [pending, startTransition] = useTransition();

  const search = () => {
    const q = query.trim();
    if (!q) return;
    startTransition(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setProfiles(data.profiles ?? []);
      setPosts(data.posts ?? []);
      setSearched(true);
    });
  };

  return (
    <FeedShell user={user} notificationCount={notificationCount}>
      <main className="flex-1 min-w-0" style={{ maxWidth: 620, background: "#fff", borderRight: `1px solid ${LINE}` }}>
        <div className="sticky top-0 z-10 px-4 py-3" style={{ borderBottom: `1px solid ${LINE}`, background: "#fff" }}>
          <h1 style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>Explorar</h1>
          <div className="flex gap-2">
            <div
              className="flex items-center gap-2 flex-1 px-4 py-2 rounded-full"
              style={{ background: "#eef3f5" }}
            >
              <Search size={18} style={{ color: "#7a8f97" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="Buscar profissionais ou publicações…"
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: 15, color: INK }}
              />
            </div>
            <button
              type="button"
              onClick={search}
              disabled={pending || !query.trim()}
              className="rounded-full px-4 py-2 font-bold"
              style={{
                background: BLUE,
                color: "#fff",
                border: "none",
                opacity: query.trim() ? 1 : 0.5,
                cursor: "pointer",
              }}
            >
              {pending ? "…" : "Buscar"}
            </button>
          </div>
        </div>

        {!searched && (
          <p className="px-4 py-12 text-center" style={{ color: "#7a8f97" }}>
            Encontre colegas por nome, @handle ou especialidade.
          </p>
        )}

        {searched && profiles.length === 0 && posts.length === 0 && (
          <p className="px-4 py-12 text-center" style={{ color: "#7a8f97" }}>
            Nenhum resultado para &quot;{query}&quot;.
          </p>
        )}

        {profiles.length > 0 && (
          <div>
            <h2 className="px-4 py-2" style={{ fontWeight: 700, fontSize: 15, color: INK }}>
              Profissionais
            </h2>
            {profiles.map((p) => (
              <ProfileResultRow key={p.id} p={p} />
            ))}
          </div>
        )}

        {posts.length > 0 && (
          <div>
            <h2 className="px-4 py-2" style={{ fontWeight: 700, fontSize: 15, color: INK }}>
              Publicações
            </h2>
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </main>
    </FeedShell>
  );
}
