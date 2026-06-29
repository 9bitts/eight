"use client";

import { useState } from "react";
import { Share } from "lucide-react";

const BLUE = "#176a88";

export function SharePostButton({ postId }: { postId: string }) {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      window.location.origin;
    const url = `${base}/post/${postId}`;

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
      style={{ color: copied ? "#1a9c5b" : "#6b818b", fontSize: 13.5 }}
      title="Copiar link da publicação"
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
