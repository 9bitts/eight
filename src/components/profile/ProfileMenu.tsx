"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Ban, VolumeX, ListPlus } from "lucide-react";
import { toggleBlock, toggleMute } from "@/lib/actions/relationships";
import { fetchListsForTarget, toggleListMember } from "@/lib/actions/lists";
import { ReportDialog } from "@/components/moderation/ReportDialog";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const CARD = "var(--eight-card-bg)";
const ORANGE = "#e05930";

type ListRow = { id: string; name: string; member: boolean };

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
  const [showLists, setShowLists] = useState(false);
  const [lists, setLists] = useState<ListRow[]>([]);
  const [listsLoaded, setListsLoaded] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowLists(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const loadLists = () => {
    if (listsLoaded) return;
    startTransition(async () => {
      const rows = await fetchListsForTarget(targetProfileId);
      setLists(rows);
      setListsLoaded(true);
    });
  };

  const onBlock = () => {
    const msg = blocked
      ? "Desbloquear este perfil?"
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

  const onToggleList = (listId: string) => {
    startTransition(async () => {
      await toggleListMember(listId, targetProfileId);
      setLists((prev) =>
        prev.map((l) => (l.id === listId ? { ...l, member: !l.member } : l))
      );
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="rounded-full p-2"
        style={{ border: `1px solid ${LINE}`, background: CARD, cursor: "pointer", color: INK }}
        aria-label="Mais opções"
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 py-1 rounded-xl border shadow-lg z-20"
          style={{ background: CARD, borderColor: LINE, minWidth: showLists ? 240 : 200 }}
        >
          {!showLists ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setShowLists(true);
                  loadLists();
                }}
                disabled={pending}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-left"
                style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 14, color: INK }}
              >
                <ListPlus size={16} />
                Adicionar à lista
              </button>
              <button
                type="button"
                onClick={() => { setReporting(true); setOpen(false); }}
                disabled={pending}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-left"
                style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 14, color: ORANGE }}
              >
                Denunciar
              </button>
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
            </>
          ) : (
            <>
              <div className="px-4 py-2 text-xs font-semibold" style={{ color: "var(--eight-muted)" }}>
                Adicionar à lista
              </div>
              {lists.length === 0 && listsLoaded ? (
                <div className="px-4 py-2 text-sm" style={{ color: "var(--eight-muted)" }}>
                  <a href="/listas" style={{ color: "#176a88" }}>Crie uma lista</a> primeiro.
                </div>
              ) : (
                lists.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => onToggleList(l.id)}
                    disabled={pending}
                    className="flex items-center justify-between w-full px-4 py-2 text-left"
                    style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 14, color: INK }}
                  >
                    {l.name}
                    <span style={{ color: l.member ? "#176a88" : "var(--eight-muted)" }}>
                      {l.member ? "✓" : "+"}
                    </span>
                  </button>
                ))
              )}
              <button
                type="button"
                onClick={() => setShowLists(false)}
                className="w-full px-4 py-2 text-left text-sm"
                style={{ border: "none", borderTop: `1px solid ${LINE}`, background: "transparent", cursor: "pointer", color: "var(--eight-muted)" }}
              >
                ← Voltar
              </button>
            </>
          )}
        </div>
      )}
      {reporting && (
        <ReportDialog targetType="PROFILE" targetId={targetProfileId} onClose={() => setReporting(false)} />
      )}
    </div>
  );
}
