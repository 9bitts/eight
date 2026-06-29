"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Search, TrendingUp, Stethoscope, Globe } from "lucide-react";
import { FeedShell } from "@/components/feed/FeedShell";
import { PostCard } from "@/components/feed/PostCard";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { formatSpec, formatCount } from "@/lib/format";
import type { BrowseItem } from "@/lib/discovery";
import type { FeedPost, SessionUser, Trend } from "@/lib/types";

const INK = "#0c2b36";
const LINE = "#e4ebee";
const BLUE = "#176a88";
const ORANGE = "#e05930";

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

function ChipGrid({
  items,
  hrefPrefix,
}: {
  items: BrowseItem[];
  hrefPrefix: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-4">
      {items.map((item) => (
        <Link
          key={item.slug}
          href={`${hrefPrefix}/${item.slug}`}
          className="rounded-full px-3 py-1.5 font-semibold transition-colors"
          style={{
            background: "#eef3f5",
            color: INK,
            fontSize: 13,
            textDecoration: "none",
            border: `1px solid ${LINE}`,
          }}
        >
          {item.label}
          {item.count > 0 && (
            <span style={{ color: "#7a8f97", fontWeight: 500, marginLeft: 4 }}>
              {formatCount(item.count)}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

function DiscoveryHome({
  specialties,
  countries,
  trends,
}: {
  specialties: BrowseItem[];
  countries: BrowseItem[];
  trends: Trend[];
}) {
  return (
    <>
      <section className="py-4 border-b" style={{ borderColor: LINE }}>
        <div className="flex items-center gap-2 px-4 pb-3">
          <TrendingUp size={18} style={{ color: ORANGE }} />
          <h2 style={{ fontWeight: 800, fontSize: 16, color: INK }}>Em alta na saúde</h2>
        </div>
        {trends.length === 0 ? (
          <p className="px-4 text-sm" style={{ color: "#7a8f97" }}>
            Use hashtags nas publicações para criar tendências.
          </p>
        ) : (
          <div className="px-4 flex flex-col gap-1">
            {trends.map((t) => (
              <Link
                key={t.tag}
                href={`/explore/tag/${t.tag}`}
                className="flex justify-between items-center py-2 rounded-lg px-2 -mx-2"
                style={{ textDecoration: "none" }}
              >
                <span style={{ fontWeight: 700, color: INK }}>#{t.tag}</span>
                <span style={{ fontSize: 13, color: "#7a8f97" }}>
                  {t.count > 0 ? `${formatCount(t.count)} posts` : "Em alta"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="py-4 border-b" style={{ borderColor: LINE }}>
        <div className="flex items-center gap-2 px-4 pb-3">
          <Stethoscope size={18} style={{ color: BLUE }} />
          <h2 style={{ fontWeight: 800, fontSize: 16, color: INK }}>Por especialidade</h2>
        </div>
        <ChipGrid items={specialties} hrefPrefix="/explore/especialidade" />
      </section>

      <section className="py-4">
        <div className="flex items-center gap-2 px-4 pb-3">
          <Globe size={18} style={{ color: BLUE }} />
          <h2 style={{ fontWeight: 800, fontSize: 16, color: INK }}>Por país</h2>
        </div>
        <ChipGrid items={countries} hrefPrefix="/explore/pais" />
      </section>
    </>
  );
}

export function ExploreClient({
  user,
  notificationCount,
  specialties,
  countries,
  trends,
}: {
  user: SessionUser;
  notificationCount: number;
  specialties: BrowseItem[];
  countries: BrowseItem[];
  trends: Trend[];
}) {
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<ProfileResult[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [searched, setSearched] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [pending, startTransition] = useTransition();

  const search = () => {
    const q = query.trim();
    if (!q) return;
    startTransition(async () => {
      const params = new URLSearchParams({ q });
      if (verifiedOnly) params.set("verified", "1");
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setProfiles(data.profiles ?? []);
      setPosts(data.posts ?? []);
      setSearched(true);
    });
  };

  const clearSearch = () => {
    setQuery("");
    setSearched(false);
    setProfiles([]);
    setPosts([]);
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
          <label className="flex items-center gap-2 mt-3 cursor-pointer" style={{ fontSize: 14, color: "#516b75" }}>
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              style={{ accentColor: BLUE }}
            />
            Somente profissionais verificados
          </label>
          {searched && (
            <button
              type="button"
              onClick={clearSearch}
              className="mt-2 text-sm font-semibold"
              style={{ color: BLUE, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              ← Voltar à descoberta
            </button>
          )}
        </div>

        {!searched && (
          <DiscoveryHome specialties={specialties} countries={countries} trends={trends} />
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
