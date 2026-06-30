"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X } from "lucide-react";
import { addGroupMembers } from "@/lib/actions/groups";

const LINE = "var(--eight-line)";
const CARD = "var(--eight-card-bg)";
const INK = "var(--eight-ink)";
const MUTED = "var(--eight-muted)";
const BLUE = "#176a88";

type Candidate = { id: string; name: string; handle: string };

export function AddMembersDialog({
  conversationId,
  candidates,
  onClose,
}: {
  conversationId: string;
  candidates: Candidate[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const add = () => {
    setError("");
    startTransition(async () => {
      try {
        await addGroupMembers(conversationId, Array.from(selected));
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao adicionar membros");
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border shadow-xl max-h-[85vh] flex flex-col"
        style={{ background: CARD, borderColor: LINE }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: LINE }}>
          <div className="flex items-center gap-2">
            <UserPlus size={20} style={{ color: BLUE }} />
            <h2 style={{ fontWeight: 800, fontSize: 18, color: INK }}>Adicionar membros</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1">
          {candidates.length === 0 ? (
            <p style={{ fontSize: 14, color: MUTED }}>
              Não há colegas verificados disponíveis para adicionar. Siga mais profissionais verificados.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {candidates.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer"
                  style={{ background: selected.has(c.id) ? "var(--eight-nav-active)" : "transparent" }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: INK }}>{c.name}</div>
                    <div style={{ fontSize: 13, color: MUTED }}>@{c.handle}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
          {error && <p className="signup-error mt-3">{error}</p>}
        </div>

        <div className="px-5 py-3 border-t flex justify-end gap-2" style={{ borderColor: LINE }}>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-2 font-bold"
            style={{ border: `1px solid ${LINE}`, background: CARD, cursor: "pointer" }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={add}
            disabled={pending || selected.size === 0}
            className="rounded-full px-5 py-2 font-bold text-white"
            style={{
              background: BLUE,
              border: "none",
              cursor: "pointer",
              opacity: selected.size > 0 && !pending ? 1 : 0.5,
            }}
          >
            {pending ? "…" : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
