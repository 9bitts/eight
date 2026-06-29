"use client";

import { useState } from "react";
import { Share } from "lucide-react";

const BLUE = "#176a88";
const MUTED = "var(--eight-muted, #6b818b)";

export function SharePostButton({ postId, title }: { postId: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const getUrl = () => {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      window.location.origin;
    return `${base}/post/${postId}`;
  };

  const onShare = async () => {
    const url = getUrl();

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: title ? `${title} · Doctor8` : "Doctor8",
          url,
        });
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie o link:", url);
    }
  };

  return (
    <button
      type="button"
      onClick={onShare}
      className="flex items-center gap-1.5 transition-colors"
      style={{ color: copied ? "#1a9c5b" : MUTED, fontSize: 13.5 }}
      title="Compartilhar publicação"
    >
      <span className="p-1.5 rounded-full">
        <Share size={18} strokeWidth={2} />
      </span>
      <span style={{ fontWeight: copied ? 700 : 400 }}>
        {copied ? "Copiado!" : ""}
      </span>
    </button>
  );
}
