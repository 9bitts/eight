"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { VolumeX } from "lucide-react";
import { addMutedWord, removeMutedWord } from "@/lib/actions/muted-words";

const LINE = "var(--eight-line)";
const CARD = "var(--eight-card-bg)";
const INK = "var(--eight-ink)";
const MUTED = "var(--eight-muted)";
const BLUE = "#176a88";

export function MutedWordsSection({
  initialWords,
}: {
  initialWords: { id: string; word: string }[];
}) {
  const router = useRouter();
  const [words, setWords] = useState(initialWords);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const add = () => {
    const w = input.trim();
    if (!w) return;
    setError("");
    startTransition(async () => {
      try {
        await addMutedWord(w);
        setWords((prev) => [...prev, { id: w, word: w.toLowerCase() }].sort((a, b) => a.word.localeCompare(b.word)));
        setInput("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      }
    });
  };

  const remove = (word: string) => {
    startTransition(async () => {
      await removeMutedWord(word);
      setWords((prev) => prev.filter((x) => x.word !== word));
      router.refresh();
    });
  };

  return (
    <section className="border-b" style={{ borderColor: LINE }}>
      <div className="px-4 py-3 flex items-center gap-2">
        <VolumeX size={18} style={{ color: BLUE }} />
        <h2 style={{ fontWeight: 700, fontSize: 16, color: INK }}>Palavras silenciadas</h2>
      </div>
      <p className="px-4 pb-3" style={{ fontSize: 13, color: MUTED, lineHeight: 1.45 }}>
        Publicações que contêm estas palavras não aparecerão no seu feed nem na busca.
      </p>
      <div className="px-4 pb-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Ex.: spam, política…"
          maxLength={50}
          className="flex-1 px-3 py-2 rounded-lg border outline-none"
          style={{ borderColor: LINE, fontSize: 14 }}
        />
        <button
          type="button"
          onClick={add}
          disabled={pending || !input.trim()}
          className="rounded-lg px-4 font-bold text-white"
          style={{ background: BLUE, border: "none", cursor: "pointer", opacity: input.trim() ? 1 : 0.5 }}
        >
          Adicionar
        </button>
      </div>
      {error && <p className="px-4 pb-2 signup-error">{error}</p>}
      {words.length > 0 && (
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          {words.map((w) => (
            <span
              key={w.word}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1"
              style={{ background: "var(--eight-nav-active)", fontSize: 13, color: INK }}
            >
              {w.word}
              <button
                type="button"
                onClick={() => remove(w.word)}
                disabled={pending}
                style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 16, lineHeight: 1 }}
                aria-label={`Remover ${w.word}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
