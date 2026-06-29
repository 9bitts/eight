"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FeedShell } from "@/components/feed/FeedShell";
import { PostCard } from "@/components/feed/PostCard";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { VerificationBanner } from "@/components/verification/VerificationBanner";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { toggleFollow } from "@/lib/actions";
import { startConversation } from "@/lib/actions/messages";
import { toggleBlock } from "@/lib/actions/relationships";
import { formatSpec } from "@/lib/format";
import type { FeedPost, SessionUser } from "@/lib/types";

const BLUE = "#176a88";
const ORANGE = "#e05930";
const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const CARD = "var(--eight-card-bg)";
const MUTED = "var(--eight-muted)";

type ProfileData = {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  specialty: string | null;
  registrationType: string | null;
  registrationNumber: string | null;
  location: string | null;
  verified: boolean;
  followers: number;
  following: number;
  postsCount: number;
  teleconsultUrl: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
};

type ProfileAnalytics = {
  views7d: number;
  views30d: number;
  scheduledCount: number;
  postCount: number;
};

export function ProfileClient({
  profile,
  posts,
  replies,
  user,
  isOwnProfile,
  isFollowing,
  blockedByViewer,
  blockedByTarget,
  isMuted,
  canMessage,
  notificationCount,
  analytics,
}: {
  profile: ProfileData;
  posts: FeedPost[];
  replies: FeedPost[];
  user: SessionUser;
  isOwnProfile: boolean;
  isFollowing: boolean;
  blockedByViewer: boolean;
  blockedByTarget: boolean;
  isMuted: boolean;
  canMessage: boolean;
  notificationCount: number;
  analytics: ProfileAnalytics | null;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(isFollowing);
  const [tab, setTab] = useState<"posts" | "replies">("posts");
  const [pending, startTransition] = useTransition();

  const spec = formatSpec(
    profile.specialty,
    profile.registrationType,
    profile.registrationNumber
  );

  const onFollow = () => {
    if (isOwnProfile || pending || blockedByViewer || blockedByTarget) return;
    startTransition(async () => {
      await toggleFollow(profile.id);
      setFollowing((f) => !f);
      router.refresh();
    });
  };

  const onUnblock = () => {
    if (!confirm("Desbloquear este perfil?")) return;
    startTransition(async () => {
      await toggleBlock(profile.id);
      router.refresh();
    });
  };

  const onMessage = () => {
    startTransition(async () => {
      try {
        const { conversationId } = await startConversation(profile.id);
        router.push(`/messages/${conversationId}`);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Não foi possível abrir a conversa.");
      }
    });
  };

  if (blockedByTarget) {
    return (
      <FeedShell user={user} notificationCount={notificationCount}>
        <main className="flex-1 min-w-0" style={{ maxWidth: 620, background: CARD, borderRight: `1px solid ${LINE}` }}>
          <div className="px-4 py-16 text-center">
            <h1 style={{ fontWeight: 800, fontSize: 20, color: INK }}>Perfil indisponível</h1>
            <p style={{ color: MUTED, marginTop: 8, fontSize: 15 }}>
              Você não tem permissão para ver este perfil.
            </p>
          </div>
        </main>
      </FeedShell>
    );
  }

  return (
    <FeedShell user={user} notificationCount={notificationCount}>
      <main className="flex-1 min-w-0" style={{ maxWidth: 620, background: CARD, borderRight: `1px solid ${LINE}` }}>
        <div
          className="sticky top-0 z-10 px-4 py-3"
          style={{ background: "var(--eight-header-bg)", borderBottom: `1px solid ${LINE}` }}
        >
          <h1 style={{ fontWeight: 800, fontSize: 18 }}>{profile.displayName}</h1>
          <p style={{ color: MUTED, fontSize: 13 }}>{profile.postsCount} publicações</p>
        </div>

        {isOwnProfile && analytics && (
          <div
            className="mx-4 mt-3 px-4 py-3 rounded-xl border grid grid-cols-2 gap-3"
            style={{ borderColor: LINE, background: "var(--eight-nav-active)" }}
          >
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: INK }}>{analytics.views7d}</div>
              <div style={{ fontSize: 12, color: MUTED }}>visualizações (7 dias)</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: INK }}>{analytics.views30d}</div>
              <div style={{ fontSize: 12, color: MUTED }}>visualizações (30 dias)</div>
            </div>
            {analytics.scheduledCount > 0 && (
              <Link
                href="/agendados"
                className="col-span-2 text-center py-2 rounded-lg font-semibold"
                style={{ fontSize: 13, background: CARD, color: BLUE, textDecoration: "none", border: `1px solid ${LINE}` }}
              >
                {analytics.scheduledCount} post{analytics.scheduledCount > 1 ? "s" : ""} agendado{analytics.scheduledCount > 1 ? "s" : ""} →
              </Link>
            )}
          </div>
        )}

        {isOwnProfile && <VerificationBanner user={user} />}

        {blockedByViewer && (
          <div className="mx-4 mt-3 px-4 py-3 rounded-xl border" style={{ background: "#fdeee8", borderColor: "#f0b8a8" }}>
            <p style={{ fontSize: 14, color: INK, fontWeight: 600 }}>Você bloqueou este perfil</p>
            <button
              type="button"
              onClick={onUnblock}
              disabled={pending}
              className="mt-2 rounded-full px-4 py-1.5 font-bold"
              style={{ border: `1px solid ${LINE}`, background: CARD, cursor: "pointer", fontSize: 13, color: ORANGE }}
            >
              Desbloquear
            </button>
          </div>
        )}

        <div
          style={{
            height: 120,
            background: profile.bannerUrl
              ? `url(${profile.bannerUrl}) center/cover`
              : `linear-gradient(135deg, ${BLUE}, #0c2b36)`,
          }}
        />

        <div className="px-4 pb-4">
          <div className="flex justify-between items-end -mt-10 mb-3 gap-2">
            <div style={{ border: `4px solid ${CARD}`, borderRadius: "50%" }}>
              <Avatar name={profile.displayName} size={80} imageUrl={profile.avatarUrl} />
            </div>
            <div className="flex items-center gap-2">
              {!isOwnProfile && !blockedByViewer && canMessage && (
                <button
                  type="button"
                  onClick={onMessage}
                  disabled={pending}
                  className="rounded-full px-4 py-2 font-bold"
                  style={{
                    fontSize: 14,
                    border: `1px solid ${LINE}`,
                    color: BLUE,
                    background: CARD,
                    cursor: "pointer",
                  }}
                >
                  Mensagem
                </button>
              )}
              {!isOwnProfile && !blockedByViewer && (
                <button
                  type="button"
                  onClick={onFollow}
                  disabled={pending}
                  className="rounded-full px-5 py-2 font-bold"
                  style={{
                    fontSize: 14,
                    background: following ? "transparent" : INK,
                    color: following ? INK : "#fff",
                    border: following ? `1px solid ${LINE}` : "none",
                    cursor: "pointer",
                  }}
                >
                  {following ? "Seguindo" : "Seguir"}
                </button>
              )}
              {!isOwnProfile && (
                <ProfileMenu
                  targetProfileId={profile.id}
                  blocked={blockedByViewer}
                  muted={isMuted}
                />
              )}
              {isOwnProfile && (
                <Link
                  href="/settings"
                  className="rounded-full px-5 py-2 font-bold"
                  style={{
                    fontSize: 14,
                    border: `1px solid ${LINE}`,
                    color: INK,
                    textDecoration: "none",
                    background: CARD,
                  }}
                >
                  Editar perfil
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            <span style={{ fontWeight: 800, fontSize: 20, color: INK }}>{profile.displayName}</span>
            {profile.verified && <VerifiedBadge size={20} />}
            {isMuted && !isOwnProfile && (
              <span style={{ fontSize: 12, color: MUTED, marginLeft: 4 }}>· silenciado</span>
            )}
          </div>
          <div style={{ color: MUTED, fontSize: 15 }}>@{profile.handle}</div>

          {profile.bio && (
            <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.5, color: "var(--eight-body-text)" }}>{profile.bio}</p>
          )}

          <div style={{ marginTop: 8, fontSize: 14, color: ORANGE, fontWeight: 600 }}>{spec}</div>
          {profile.location && (
            <div style={{ marginTop: 4, fontSize: 14, color: MUTED }}>{profile.location}</div>
          )}

          {profile.verified && profile.teleconsultUrl && (
            <a
              href={profile.teleconsultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-3 px-4 py-2 rounded-full font-bold"
              style={{
                fontSize: 13,
                background: "#e8f4f8",
                color: BLUE,
                textDecoration: "none",
              }}
            >
              Teleconsulta Doctor8 →
            </a>
          )}

          <div className="flex gap-4 mt-3" style={{ fontSize: 14, color: MUTED }}>
            <Link
              href={`/${profile.handle}/following`}
              style={{ textDecoration: "none", color: MUTED }}
            >
              <strong style={{ color: INK }}>{profile.following}</strong> seguindo
            </Link>
            <Link
              href={`/${profile.handle}/followers`}
              style={{ textDecoration: "none", color: MUTED }}
            >
              <strong style={{ color: INK }}>{profile.followers}</strong> seguidores
            </Link>
            {isOwnProfile && (
              <Link href="/listas" style={{ textDecoration: "none", color: BLUE, fontWeight: 600 }}>
                Listas
              </Link>
            )}
          </div>
        </div>

        {!blockedByViewer && (
          <>
            <div className="flex border-b" style={{ borderColor: LINE }}>
              {(["posts", "replies"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className="flex-1 py-3 font-bold"
                  style={{
                    fontSize: 14,
                    border: "none",
                    borderBottom: tab === t ? `3px solid ${BLUE}` : "3px solid transparent",
                    background: "transparent",
                    color: tab === t ? INK : MUTED,
                    cursor: "pointer",
                  }}
                >
                  {t === "posts" ? "Publicações" : "Respostas"}
                </button>
              ))}
            </div>
            <div>
              {(tab === "posts" ? posts : replies).length === 0 ? (
                <p className="px-4 py-8 text-center" style={{ color: MUTED }}>
                  {tab === "posts"
                    ? isOwnProfile
                      ? "Você ainda não publicou nada."
                      : "Nenhuma publicação ainda."
                    : isOwnProfile
                      ? "Você ainda não respondeu nada."
                      : "Nenhuma resposta ainda."}
                </p>
              ) : (
                (tab === "posts" ? posts : replies).map((p) => (
                  <PostCard key={p.id} post={p} />
                ))
              )}
            </div>
          </>
        )}
      </main>
    </FeedShell>
  );
}
