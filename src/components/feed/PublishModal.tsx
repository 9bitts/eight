"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { PostComposer } from "@/components/feed/PostComposer";
import type { SessionUser } from "@/lib/types";

const LINE = "var(--eight-line)";
const CARD = "var(--eight-card-bg)";
const INK = "var(--eight-ink)";
const MUTED = "var(--eight-muted)";

export function PublishModal({ user, onClose }: { user: SessionUser; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[8vh] overflow-y-auto"
      style={{ background: "rgba(0,0,0,.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border shadow-xl"
        style={{ background: CARD, borderColor: LINE }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-modal-title"
      >
        <div
          className="px-4 py-3 border-b flex items-center justify-between sticky top-0 rounded-t-2xl"
          style={{ borderColor: LINE, background: CARD }}
        >
          <h2 id="publish-modal-title" style={{ fontWeight: 800, fontSize: 18, color: INK }}>
            Nova publicação
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-full"
            style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}
          >
            <X size={20} />
          </button>
        </div>
        <PostComposer user={user} embedded autoFocus onPublished={onClose} />
      </div>
    </div>
  );
}
