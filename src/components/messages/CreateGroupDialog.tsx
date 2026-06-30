"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, X } from "lucide-react";
import { createGroupConversation } from "@/lib/actions/groups";
import { GROUP_NAME_MAX_LENGTH } from "@/lib/constants";

const LINE = "var(--eight-line)";
const CARD = "var(--eight-card-bg)";
const INK = "var(--eight-ink)";
const MUTED = "var(--eight-muted)";
const BLUE = "#176a88";

type Candidate = { id: string; name: string; handle: string };

export function CreateGroupDialog({
  candidates,
  onClose,
}: {
  candidates: Candidate[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
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

  const create = () => {
    setError("");
    startTransition(async () => {
      try {
        const { conversationId } = await createGroupConversation(name, Array.from(selected));
        router.push(`/messages/${conversationId}`);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao criar grupo");
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
            <Users size={20} style={{ color: BLUE }} />
            <h2 style={{ fontWeight: 800, fontSize: 18, color: INK }}>Novo grupo</h2>
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
          <label style={{ fontSize: 13, fontWeight: 700, color: INK }}>Nome do grupo</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Plantão UTI — SP"
            maxLength={GROUP_NAME_MAX_LENGTH}
            className="w-full mt-1 mb-4 px-3 py-2 rounded-lg border outline-none"
            style={{ borderColor: LINE, fontSize: 15 }}
          />

          <p style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 8 }}>
            Adicionar colegas verificados que você segue
          </p>

          {candidates.length === 0 ? (
            <p style={{ fontSize: 14, color: MUTED }}>
              Siga profissionais verificados para adicioná-los a um grupo.
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
            onClick={create}
            disabled={pending || !name.trim() || selected.size === 0}
            className="rounded-full px-5 py-2 font-bold text-white"
            style={{
              background: BLUE,
              border: "none",
              cursor: "pointer",
              opacity: name.trim() && selected.size > 0 && !pending ? 1 : 0.5,
            }}
          >
            {pending ? "…" : "Criar grupo"}
          </button>
        </div>
      </div>
    </div>
  );
}
