"use client";

import { useState, useTransition, useEffect } from "react";
import { fetchPostEditHistory } from "@/lib/actions/post-edits";
import { timeAgo } from "@/lib/format";

const LINE = "var(--eight-line)";
const CARD = "var(--eight-card-bg)";
const INK = "var(--eight-ink)";
const MUTED = "var(--eight-muted)";

type EditEntry = { id: string; body: string; editedAt: string };

export function EditHistoryDialog({
  postId,
  currentBody,
  onClose,
}: {
  postId: string;
  currentBody: string;
  onClose: () => void;
}) {
  const [edits, setEdits] = useState<EditEntry[] | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const history = await fetchPostEditHistory(postId);
      setEdits(history);
    });
  }, [postId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border shadow-xl max-h-[80vh] overflow-y-auto"
        style={{ background: CARD, borderColor: LINE }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: LINE }}>
          <h2 style={{ fontWeight: 800, fontSize: 18, color: INK }}>Histórico de edições</h2>
        </div>

        <div className="px-5 py-4">
          {pending && !edits && (
            <p style={{ color: MUTED, fontSize: 14 }}>Carregando…</p>
          )}

          {edits && edits.length === 0 && (
            <p style={{ color: MUTED, fontSize: 14 }}>Nenhuma versão anterior registrada.</p>
          )}

          {edits && edits.length > 0 && (
            <div className="flex flex-col gap-4">
              {edits.map((e) => (
                <div key={e.id} className="border-b pb-4 last:border-0" style={{ borderColor: LINE }}>
                  <p style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>
                    {timeAgo(new Date(e.editedAt))}
                  </p>
                  <p style={{ fontSize: 15, lineHeight: 1.45, color: INK, whiteSpace: "pre-wrap" }}>
                    {e.body}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t" style={{ borderColor: LINE }}>
            <p style={{ fontSize: 12, color: MUTED, marginBottom: 6, fontWeight: 700 }}>
              Versão atual
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.45, color: INK, whiteSpace: "pre-wrap" }}>
              {currentBody}
            </p>
          </div>
        </div>

        <div className="px-5 py-3 border-t flex justify-end" style={{ borderColor: LINE }}>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-2 font-bold"
            style={{ background: "#176a88", color: "#fff", border: "none", cursor: "pointer" }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
