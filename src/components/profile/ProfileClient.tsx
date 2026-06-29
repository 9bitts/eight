"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FeedShell } from "@/components/feed/FeedShell";
import { PostCard } from "@/components/feed/PostCard";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { toggleFollow } from "@/lib/actions";
import { formatSpec } from "@/lib/format";
import type { FeedPost, SessionUser } from "@/lib/types";

const BLUE = "#176a88";
const ORANGE = "#e05930";
const INK = "#0c2b36";
const LINE = "#e4ebee";

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
};

export function ProfileClient({
  profile,
  posts,
  user,
  isOwnProfile,
  isFollowing,
  notificationCount,
}: {
  profile: ProfileData;
  posts: FeedPost[];
  user: SessionUser;
  isOwnProfile: boolean;
  isFollowing: boolean;
  notificationCount: number;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(isFollowing);
  const [pending, startTransition] = useTransition();

  const spec = formatSpec(
    profile.specialty,
    profile.registrationType,
    profile.registrationNumber
  );

  const onFollow = () => {
    if (isOwnProfile || pending) return;
    startTransition(async () => {
      await toggleFollow(profile.id);
      setFollowing((f) => !f);
      router.refresh();
    });
  };

  return (
    <FeedShell user={user} notificationCount={notificationCount}>
      <main className="flex-1 min-w-0" style={{ maxWidth: 620, background: "#fff", borderRight: `1px solid ${LINE}` }}>
        <div
          className="sticky top-0 z-10 px-4 py-3"
          style={{ background: "rgba(255,255,255,.92)", borderBottom: `1px solid ${LINE}` }}
        >
          <h1 style={{ fontWeight: 800, fontSize: 18 }}>{profile.displayName}</h1>
          <p style={{ color: "#7a8f97", fontSize: 13 }}>{profile.postsCount} publicações</p>
        </div>

        <div style={{ height: 120, background: `linear-gradient(135deg, ${BLUE}, ${INK})` }} />

        <div className="px-4 pb-4">
          <div className="flex justify-between items-end -mt-10 mb-3">
            <div style={{ border: "4px solid #fff", borderRadius: "50%" }}>
              <Avatar name={profile.displayName} size={80} />
            </div>
            {!isOwnProfile && (
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
            {isOwnProfile && (
              <Link
                href="/settings"
                className="rounded-full px-5 py-2 font-bold"
                style={{
                  fontSize: 14,
                  border: `1px solid ${LINE}`,
                  color: INK,
                  textDecoration: "none",
                }}
              >
                Editar perfil
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            <span style={{ fontWeight: 800, fontSize: 20, color: INK }}>{profile.displayName}</span>
            {profile.verified && <VerifiedBadge size={20} />}
          </div>
          <div style={{ color: "#7a8f97", fontSize: 15 }}>@{profile.handle}</div>

          {profile.bio && (
            <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.5, color: "#1b3a45" }}>{profile.bio}</p>
          )}

          <div style={{ marginTop: 8, fontSize: 14, color: ORANGE, fontWeight: 600 }}>{spec}</div>
          {profile.location && (
            <div style={{ marginTop: 4, fontSize: 14, color: "#7a8f97" }}>{profile.location}</div>
          )}

          <div className="flex gap-4 mt-3" style={{ fontSize: 14, color: "#7a8f97" }}>
            <span>
              <strong style={{ color: INK }}>{profile.following}</strong> seguindo
            </span>
            <span>
              <strong style={{ color: INK }}>{profile.followers}</strong> seguidores
            </span>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${LINE}` }}>
          {posts.length === 0 ? (
            <p className="px-4 py-8 text-center" style={{ color: "#7a8f97" }}>
              {isOwnProfile ? "Você ainda não publicou nada." : "Nenhuma publicação ainda."}
            </p>
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </div>
      </main>
    </FeedShell>
  );
}
