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
import { sendMessageRequest } from "@/lib/actions/message-requests";
import { toggleBlock } from "@/lib/actions/relationships";
import { formatSpec } from "@/lib/format";
import type { FeedPost, SessionUser } from "@/lib/types";
import type { ProfileListSummary } from "@/lib/lists";
import { Globe, List } from "lucide-react";

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
  likes,
  user,
  isOwnProfile,
  isFollowing,
  blockedByViewer,
  blockedByTarget,
  isMuted,
  canMessage,
  notificationCount,
  analytics,
  publicLists = [],
}: {
  profile: ProfileData;
  posts: FeedPost[];
  replies: FeedPost[];
  likes: FeedPost[];
  user: SessionUser;
  isOwnProfile: boolean;
  isFollowing: boolean;
  blockedByViewer: boolean;
  blockedByTarget: boolean;
  isMuted: boolean;
  canMessage: boolean;
  notificationCount: number;
  analytics: ProfileAnalytics | null;
  publicLists?: ProfileListSummary[];
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(isFollowing);
  const [tab, setTab] = useState<"posts" | "replies" | "likes">("posts");
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestBody, setRequestBody] = useState("");

  const copyProfileLink = () => {
    const url = `${window.location.origin}/${profile.handle}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
        const result = await startConversation(profile.id);
        if ("conversationId" in result && result.conversationId) {
          router.push(`/messages/${result.conversationId}`);
          return;
        }
        if ("needsRequest" in result && result.needsRequest) {
          setRequestOpen(true);
          return;
        }
      } catch (e) {
        alert(e instanceof Error ? e.message : "Não foi possível abrir a conversa.");
      }
    });
  };

  const onSendRequest = () => {
    if (!requestBody.trim()) return;
    startTransition(async () => {
      try {
        const result = await sendMessageRequest(profile.id, requestBody);
        if ("conversationId" in result && result.conversationId) {
          router.push(`/messages/${result.conversationId}`);
          return;
        }
        setRequestOpen(false);
        setRequestBody("");
        alert("Pedido enviado! A pessoa precisa aceitar para vocês conversarem.");
      } catch (e) {
        alert(e instanceof Error ? e.message : "Erro ao enviar pedido.");
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
          <>
            <Link
              href="/analytics"
              className="mx-4 mt-3 px-4 py-3 rounded-xl border grid grid-cols-2 gap-3 block"
              style={{ borderColor: LINE, background: "var(--eight-nav-active)", textDecoration: "none" }}
            >
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: INK }}>{analytics.views7d}</div>
                <div style={{ fontSize: 12, color: MUTED }}>visualizações (7 dias)</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: INK }}>{analytics.views30d}</div>
                <div style={{ fontSize: 12, color: MUTED }}>visualizações (30 dias)</div>
              </div>
              <div
                className="col-span-2 text-center py-1"
                style={{ fontSize: 13, color: BLUE, fontWeight: 600 }}
              >
                Ver analytics e visitantes →
              </div>
            </Link>
            {analytics.scheduledCount > 0 && (
              <Link
                href="/agendados"
                className="mx-4 mt-2 block text-center py-2 rounded-lg font-semibold"
                style={{ fontSize: 13, background: CARD, color: BLUE, textDecoration: "none", border: `1px solid ${LINE}` }}
              >
                {analytics.scheduledCount} post{analytics.scheduledCount > 1 ? "s" : ""} agendado{analytics.scheduledCount > 1 ? "s" : ""} →
              </Link>
            )}
          </>
        )}

        {isOwnProfile && <VerificationBanner user={user} />}

        {blockedByViewer && (
          <div className="mx-4 mt-3 px-4 py-3 rounded-xl border" style={{ background: "rgba(224,89,48,.1)", borderColor: "rgba(224,89,48,.3)" }}>
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
                <>
                  <button
                    type="button"
                    onClick={copyProfileLink}
                    className="rounded-full px-4 py-2 font-bold"
                    style={{
                      fontSize: 14,
                      border: `1px solid ${LINE}`,
                      color: BLUE,
                      background: CARD,
                      cursor: "pointer",
                    }}
                  >
                    {copied ? "Link copiado!" : "Copiar link"}
                  </button>
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
                </>
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

          {publicLists.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {publicLists.map((list) => (
                <Link
                  key={list.id}
                  href={`/listas/${list.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                    color: INK,
                    background: "var(--eight-nav-active)",
                    border: `1px solid ${LINE}`,
                  }}
                >
                  <List size={13} style={{ color: BLUE }} />
                  {list.name}
                  <Globe size={12} style={{ color: BLUE }} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {!blockedByViewer && (
          <>
            <div className="flex border-b" style={{ borderColor: LINE }}>
              {(
                [
                  { id: "posts" as const, label: "Publicações" },
                  { id: "replies" as const, label: "Respostas" },
                  ...(isOwnProfile ? [{ id: "likes" as const, label: "Curtidas" }] : []),
                ]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className="flex-1 py-3 font-bold"
                  style={{
                    fontSize: 14,
                    border: "none",
                    borderBottom: tab === t.id ? `3px solid ${BLUE}` : "3px solid transparent",
                    background: "transparent",
                    color: tab === t.id ? INK : MUTED,
                    cursor: "pointer",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div>
              {(tab === "posts" ? posts : tab === "replies" ? replies : likes).length === 0 ? (
                <p className="px-4 py-8 text-center" style={{ color: MUTED }}>
                  {tab === "posts"
                    ? isOwnProfile
                      ? "Você ainda não publicou nada."
                      : "Nenhuma publicação ainda."
                    : tab === "replies"
                      ? isOwnProfile
                        ? "Você ainda não respondeu nada."
                        : "Nenhuma resposta ainda."
                      : "Você ainda não curtiu nenhuma publicação."}
                </p>
              ) : (
                (tab === "posts" ? posts : tab === "replies" ? replies : likes).map((p) => (
                  <PostCard key={p.id} post={p} trackImpression={!isOwnProfile} />
                ))
              )}
            </div>
          </>
        )}
      </main>

      {requestOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,.45)" }}
          onClick={() => setRequestOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-5"
            style={{ background: CARD, border: `1px solid ${LINE}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontWeight: 800, fontSize: 17, color: INK }}>Pedido de mensagem</h3>
            <p style={{ fontSize: 14, color: MUTED, marginTop: 8, lineHeight: 1.45 }}>
              Vocês ainda não se seguem mutuamente. Envie uma mensagem introdutória para{" "}
              <strong>{profile.displayName}</strong> aceitar.
            </p>
            <textarea
              className="field field-app w-full mt-4"
              rows={3}
              maxLength={300}
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              placeholder="Olá, gostaria de conversar sobre..."
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                type="button"
                onClick={() => setRequestOpen(false)}
                className="rounded-full px-4 py-2 font-bold"
                style={{ border: `1px solid ${LINE}`, background: CARD, color: MUTED, cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onSendRequest}
                disabled={pending || !requestBody.trim()}
                className="rounded-full px-4 py-2 font-bold"
                style={{ border: "none", background: BLUE, color: "#fff", cursor: "pointer" }}
              >
                {pending ? "…" : "Enviar pedido"}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedShell>
  );
}
