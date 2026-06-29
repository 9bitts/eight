"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { toggleFollow } from "@/lib/actions";
import type { ConnectionProfile } from "@/lib/types";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const MUTED = "var(--eight-muted)";
const BLUE = "#176a88";

export function ConnectionRow({
  profile,
  showFollowsYou,
}: {
  profile: ConnectionProfile;
  showFollowsYou?: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(profile.following);
  const [pending, startTransition] = useTransition();

  const onFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    startTransition(async () => {
      await toggleFollow(profile.id);
      setFollowing((f) => !f);
      router.refresh();
    });
  };

  return (
    <Link
      href={`/${profile.handle}`}
      className="flex items-center gap-3 px-4 py-3 border-b"
      style={{ borderColor: LINE, textDecoration: "none" }}
    >
      <Avatar name={profile.displayName} size={48} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span style={{ fontWeight: 700, color: INK }}>{profile.displayName}</span>
          {profile.verified && <VerifiedBadge size={15} />}
          {showFollowsYou && profile.followsYou && (
            <span
              className="px-2 py-0.5 rounded"
              style={{ fontSize: 11, background: "var(--eight-surface-subtle)", color: MUTED }}
            >
              segue você
            </span>
          )}
        </div>
        <div style={{ color: MUTED, fontSize: 14 }}>@{profile.handle}</div>
        {profile.spec && (
          <div style={{ color: BLUE, fontSize: 13, marginTop: 2 }}>{profile.spec}</div>
        )}
      </div>
      <button
        type="button"
        onClick={onFollow}
        disabled={pending}
        className="rounded-full px-4 py-1.5 font-bold shrink-0"
        style={{
          fontSize: 13,
          background: following ? "transparent" : INK,
          color: following ? INK : "#fff",
          border: following ? `1px solid ${LINE}` : "none",
          cursor: "pointer",
        }}
      >
        {following ? "Seguindo" : "Seguir"}
      </button>
    </Link>
  );
}
