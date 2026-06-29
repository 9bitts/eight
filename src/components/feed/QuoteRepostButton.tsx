"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Quote } from "lucide-react";
import { createQuotePost } from "@/lib/actions";

export function QuoteRepostButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async () => {
    setPending(true);
    setError("");
    try {
      await createQuotePost(postId, text);
      setOpen(false);
      setText("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao citar.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 transition-colors"
        style={{ color: "var(--eight-muted)", fontSize: 13.5 }}
        title="Citar publicação"
      >
        <span className="p-1.5 rounded-full">
          <Quote size={18} strokeWidth={2} />
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,.45)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-5"
            style={{ background: "var(--eight-card-bg)", border: "1px solid var(--eight-line)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontWeight: 800, fontSize: 16, color: "var(--eight-ink)", marginBottom: 12 }}>
              Citar publicação
            </h3>
            <textarea
              className="field w-full"
              rows={4}
              placeholder="Adicione seu comentário…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              autoFocus
            />
            {error && <p className="mt-2 text-sm" style={{ color: "#e05930" }}>{error}</p>}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full py-2 font-bold"
                style={{
                  border: "1px solid var(--eight-line)",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--eight-ink)",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={pending || !text.trim()}
                className="flex-1 rounded-full py-2 font-bold text-white"
                style={{ background: "#176a88", border: "none", cursor: "pointer", opacity: pending ? 0.6 : 1 }}
              >
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
