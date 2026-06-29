"use client";

import type { LinkPreviewData, PollData } from "@/lib/types";
import { votePoll } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const BLUE = "#176a88";
const LINE = "var(--eight-line)";
const MUTED = "var(--eight-muted)";
const INK = "var(--eight-ink)";

export function LinkPreviewCard({ preview }: { preview: LinkPreviewData }) {
  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-3 rounded-xl overflow-hidden border"
      style={{ borderColor: LINE, textDecoration: "none" }}
    >
      {preview.image && (
        <img
          src={preview.image}
          alt=""
          className="w-full max-h-48 object-cover"
          style={{ background: "var(--eight-surface-subtle)" }}
        />
      )}
      <div className="p-3" style={{ background: "var(--eight-surface-muted)" }}>
        <div style={{ fontSize: 12, color: MUTED }}>
          {new URL(preview.url).hostname}
        </div>
        {preview.title && (
          <div style={{ fontWeight: 700, fontSize: 14, color: INK, marginTop: 2 }}>
            {preview.title}
          </div>
        )}
        {preview.description && (
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4, lineHeight: 1.4 }}>
            {preview.description.slice(0, 120)}
          </div>
        )}
      </div>
    </a>
  );
}

export function PostMedia({
  images,
  videoUrl,
  gifUrl,
}: {
  images: string[];
  videoUrl: string | null;
  gifUrl: string | null;
}) {
  if (gifUrl) {
    return (
      <img
        src={gifUrl}
        alt=""
        className="mt-3 rounded-xl max-h-80 w-full object-cover border"
        style={{ borderColor: LINE }}
      />
    );
  }

  if (videoUrl) {
    return (
      <video
        src={videoUrl}
        controls
        className="mt-3 rounded-xl max-h-80 w-full border"
        style={{ borderColor: LINE }}
      />
    );
  }

  if (images.length === 0) return null;

  const grid =
    images.length === 1
      ? "grid-cols-1"
      : images.length === 2
        ? "grid-cols-2"
        : "grid-cols-2";

  return (
    <div className={`mt-3 grid ${grid} gap-1 rounded-xl overflow-hidden`}>
      {images.slice(0, 4).map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className="w-full object-cover"
          style={{ maxHeight: images.length === 1 ? 320 : 160, background: "var(--eight-surface-subtle)" }}
        />
      ))}
    </div>
  );
}

export function PollCard({ poll }: { poll: PollData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const vote = (optionId: string) => {
    if (poll.ended || pending) return;
    startTransition(async () => {
      await votePoll(poll.id, optionId);
      router.refresh();
    });
  };

  return (
    <div className="mt-3 rounded-xl border p-3" style={{ borderColor: LINE }}>
      {poll.options.map((o) => (
        <button
          key={o.id}
          type="button"
          disabled={poll.ended || (poll.userVoted && !o.voted)}
          onClick={() => vote(o.id)}
          className="w-full text-left mb-2 last:mb-0 relative overflow-hidden rounded-lg border"
          style={{
            borderColor: o.voted ? BLUE : LINE,
            padding: "10px 12px",
            cursor: poll.ended || poll.userVoted ? "default" : "pointer",
            background: o.voted ? "var(--eight-nav-active)" : "var(--eight-card-bg)",
          }}
        >
          {(poll.userVoted || poll.ended) && (
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${o.percent}%`,
                background: o.voted ? "rgba(23,106,136,.15)" : "rgba(23,106,136,.08)",
              }}
            />
          )}
          <div className="relative flex justify-between gap-2">
            <span style={{ fontSize: 14, fontWeight: o.voted ? 700 : 500, color: "var(--eight-ink)" }}>
              {o.text}
            </span>
            {(poll.userVoted || poll.ended) && (
              <span style={{ fontSize: 13, color: "var(--eight-muted)" }}>{o.percent}%</span>
            )}
          </div>
        </button>
      ))}
      <p style={{ fontSize: 12, color: "var(--eight-muted)", marginTop: 8 }}>
        {poll.totalVotes} voto{poll.totalVotes !== 1 ? "s" : ""}
        {poll.ended ? " · Encerrada" : ""}
      </p>
    </div>
  );
}
