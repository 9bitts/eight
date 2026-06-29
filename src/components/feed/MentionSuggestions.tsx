"use client";

import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const MUTED = "var(--eight-muted)";
const CARD = "var(--eight-card-bg)";

export type MentionOption = {
  handle: string;
  displayName: string;
  verified: boolean;
  specialty: string | null;
};

export function MentionSuggestions({
  options,
  onSelect,
}: {
  options: MentionOption[];
  onSelect: (handle: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <ul
      className="absolute left-0 right-0 z-20 mt-1 rounded-xl border overflow-hidden shadow-lg"
      style={{ borderColor: LINE, background: CARD }}
    >
      {options.map((o) => (
        <li key={o.handle}>
          <button
            type="button"
            onClick={() => onSelect(o.handle)}
            className="flex items-center gap-2 w-full px-3 py-2 text-left"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderBottom: `1px solid ${LINE}`,
            }}
          >
            <Avatar name={o.displayName} size={32} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span style={{ fontWeight: 700, fontSize: 14, color: INK }}>{o.displayName}</span>
                {o.verified && <VerifiedBadge size={13} />}
              </div>
              <div style={{ fontSize: 13, color: MUTED }}>@{o.handle}</div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function getMentionQuery(text: string, cursor: number): string | null {
  const before = text.slice(0, cursor);
  const match = before.match(/@([a-zA-Z0-9_]{0,30})$/);
  return match ? match[1] : null;
}

export function insertMention(text: string, cursor: number, handle: string): { text: string; cursor: number } {
  const before = text.slice(0, cursor);
  const after = text.slice(cursor);
  const match = before.match(/@([a-zA-Z0-9_]{0,30})$/);
  if (!match) return { text, cursor };

  const start = before.length - match[0].length;
  const next = `${text.slice(0, start)}@${handle} ${after}`;
  const newCursor = start + handle.length + 2;
  return { text: next, cursor: newCursor };
}
