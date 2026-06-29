"use client";

import Link from "next/link";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { PostBody } from "@/components/feed/PostBody";
import type { FeedPost } from "@/lib/types";

export function QuotedPostCard({ quoted }: { quoted: NonNullable<FeedPost["quotedPost"]> }) {
  return (
    <Link
      href={`/post/${quoted.id}`}
      className="block mt-2 rounded-xl border overflow-hidden"
      style={{
        borderColor: "var(--eight-line)",
        textDecoration: "none",
        background: "var(--eight-nav-active)",
      }}
    >
      <div className="px-3 py-2">
        <div className="flex items-center gap-1">
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--eight-ink)" }}>{quoted.name}</span>
          {quoted.verified && <VerifiedBadge size={14} />}
          <span style={{ color: "var(--eight-muted)", fontSize: 13 }}>@{quoted.handle}</span>
        </div>
        <div style={{ fontSize: 14, color: "var(--eight-body-text)", marginTop: 4 }}>
          <PostBody text={quoted.body} />
        </div>
        {quoted.images[0] && (
          <img
            src={quoted.images[0]}
            alt=""
            className="mt-2 rounded-lg w-full max-h-40 object-cover"
          />
        )}
      </div>
    </Link>
  );
}
