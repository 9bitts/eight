"use client";

import Link from "next/link";
import { FeedShell } from "@/components/feed/FeedShell";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { timeAgo, formatCount } from "@/lib/format";
import type { ProfileViewer } from "@/lib/analytics";
import type { PostViewStat, ViewTimelinePoint } from "@/lib/post-analytics";
import type { SessionUser } from "@/lib/types";
import { ViewTimelineChart } from "@/components/analytics/ViewTimelineChart";
import { Eye, BarChart3, Heart, MessageCircle } from "lucide-react";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const MUTED = "var(--eight-muted)";
const CARD = "var(--eight-card-bg)";
const BLUE = "#176a88";
const ORANGE = "#e05930";

export function AnalyticsClient({
  user,
  notificationCount,
  analytics,
  viewers,
  postAnalytics,
  viewTimeline,
}: {
  user: SessionUser;
  notificationCount: number;
  analytics: { views7d: number; views30d: number; postCount: number };
  viewers: ProfileViewer[];
  postAnalytics: { totalViews: number; views7d: number; posts: PostViewStat[] };
  viewTimeline: ViewTimelinePoint[];
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
          <Link href={`/${user.handle}`} style={{ fontSize: 13, color: BLUE, textDecoration: "none" }}>
            ← Meu perfil
          </Link>
          <h1 style={{ fontWeight: 800, fontSize: 20, color: INK, marginTop: 4 }}>Analytics</h1>
          <p style={{ color: MUTED, fontSize: 13 }}>Visualizações do perfil e das publicações</p>
        </div>

        <div className="grid grid-cols-3 gap-3 px-4 py-4 border-b" style={{ borderColor: LINE }}>
          <div className="rounded-xl p-3 text-center" style={{ background: "var(--eight-nav-active)" }}>
            <BarChart3 size={18} style={{ color: BLUE, margin: "0 auto 6px" }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: INK }}>{analytics.views7d}</div>
            <div style={{ fontSize: 11, color: MUTED }}>perfil · 7d</div>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: "var(--eight-nav-active)" }}>
            <Eye size={18} style={{ color: ORANGE, margin: "0 auto 6px" }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: INK }}>{formatCount(postAnalytics.views7d)}</div>
            <div style={{ fontSize: 11, color: MUTED }}>posts · 7d</div>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: "var(--eight-nav-active)" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: INK, marginTop: 24 }}>{analytics.postCount}</div>
            <div style={{ fontSize: 11, color: MUTED }}>publicações</div>
          </div>
        </div>

        <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: LINE }}>
          <BarChart3 size={18} style={{ color: BLUE }} />
          <h2 style={{ fontWeight: 700, fontSize: 16, color: INK }}>Visualizações — últimos 14 dias</h2>
        </div>
        <ViewTimelineChart points={viewTimeline} />

        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${LINE}` }}>
          <Eye size={18} style={{ color: ORANGE }} />
          <h2 style={{ fontWeight: 700, fontSize: 16, color: INK }}>Publicações por visualizações</h2>
          <span className="ml-auto" style={{ fontSize: 12, color: MUTED }}>
            {formatCount(postAnalytics.totalViews)} no total
          </span>
        </div>

        {postAnalytics.posts.length === 0 ? (
          <p className="px-4 py-8 text-center" style={{ color: MUTED, fontSize: 14 }}>
            Publique conteúdo para ver as estatísticas de visualização.
          </p>
        ) : (
          postAnalytics.posts.slice(0, 20).map((p) => (
            <Link
              key={p.id}
              href={`/post/${p.id}`}
              className="block px-4 py-3 border-b"
              style={{ borderColor: LINE, textDecoration: "none" }}
            >
              <p style={{ fontSize: 14, color: INK, lineHeight: 1.45, marginBottom: 8 }}>{p.bodyPreview}</p>
              <div className="flex items-center gap-4 flex-wrap" style={{ fontSize: 13, color: MUTED }}>
                <span className="flex items-center gap-1" style={{ color: ORANGE, fontWeight: 700 }}>
                  <Eye size={14} /> {formatCount(p.views)}
                  {p.views7d > 0 && (
                    <span style={{ fontWeight: 500, color: MUTED }}> (+{p.views7d} esta semana)</span>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <Heart size={14} /> {p.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={14} /> {p.replies}
                </span>
                <span className="ml-auto">{timeAgo(p.createdAt)}</span>
              </div>
            </Link>
          ))
        )}

        <div className="px-4 py-3 flex items-center gap-2 mt-2" style={{ borderBottom: `1px solid ${LINE}` }}>
          <BarChart3 size={18} style={{ color: BLUE }} />
          <h2 style={{ fontWeight: 700, fontSize: 16, color: INK }}>Quem visitou seu perfil</h2>
        </div>

        {viewers.length === 0 ? (
          <p className="px-4 py-12 text-center" style={{ color: MUTED }}>
            Ainda não há visitantes registrados nos últimos acessos.
          </p>
        ) : (
          viewers.map((v) => (
            <Link
              key={v.id}
              href={`/${v.handle}`}
              className="flex items-center gap-3 px-4 py-3 border-b"
              style={{ borderColor: LINE, textDecoration: "none" }}
            >
              <Avatar name={v.displayName} size={48} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span style={{ fontWeight: 700, color: INK }}>{v.displayName}</span>
                  {v.verified && <VerifiedBadge size={15} />}
                </div>
                <div style={{ color: MUTED, fontSize: 14 }}>@{v.handle}</div>
                {v.spec && (
                  <div style={{ color: ORANGE, fontSize: 13, fontWeight: 600 }}>{v.spec}</div>
                )}
              </div>
              <span style={{ fontSize: 12, color: MUTED, flexShrink: 0 }}>
                {timeAgo(v.viewedAt)}
              </span>
            </Link>
          ))
        )}
      </main>
    </FeedShell>
  );
}
