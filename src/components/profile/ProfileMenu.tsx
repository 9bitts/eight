"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Ban, VolumeX } from "lucide-react";
import { toggleBlock, toggleMute } from "@/lib/actions/relationships";

const INK = "#0c2b36";
const LINE = "#e4ebee";
const ORANGE = "#e05930";

export function ProfileMenu({
  targetProfileId,
  blocked,
  muted,
}: {
  targetProfileId: string;
  blocked: boolean;
  muted: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const onBlock = () => {
    const msg = blocked
      ? "Desbloquear este profil?"
      : "Bloquear este perfil? Vocês deixarão de se seguir e não verão o conteúdo um do outro.";
    if (!confirm(msg)) return;
    startTransition(async () => {
      await toggleBlock(targetProfileId);
      setOpen(false);
      router.refresh();
    });
  };

  const onMute = () => {
    startTransition(async () => {
      await toggleMute(targetProfileId);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="rounded-full p-2"
        style={{ border: `1px solid ${LINE}`, background: "#fff", cursor: "pointer", color: INK }}
        aria-label="Mais opções"
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 py-1 rounded-xl border shadow-lg z-20"
          style={{ background: "#fff", borderColor: LINE, minWidth: 200 }}
        >
          <button
            type="button"
            onClick={onMute}
            disabled={pending}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-left"
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 14, color: INK }}
          >
            <VolumeX size={16} />
            {muted ? "Dessilenciar" : "Silenciar"}
          </button>
          <button
            type="button"
            onClick={onBlock}
            disabled={pending}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-left"
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 14, color: ORANGE }}
          >
            <Ban size={16} />
            {blocked ? "Desbloquear" : "Bloquear"}
          </button>
        </div>
      )}
    </div>
  );
}
