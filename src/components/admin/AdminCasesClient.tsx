"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Sparkles, Eye, EyeOff, CheckCircle } from "lucide-react";
import {
  adminReviewClinicalCase,
  adminHideClinicalCase,
  adminRestoreClinicalCase,
} from "@/lib/actions/cases-admin";
import { timeAgo } from "@/lib/format";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const MUTED = "var(--eight-muted)";
const CARD = "var(--eight-card-bg)";
const ORANGE = "#e05930";
const GREEN = "#1a9c5b";
const BLUE = "#176a88";

export type AdminClinicalCase = {
  id: string;
  body: string;
  caseSpecialty: string | null;
  caseTags: string[];
  hidden: boolean;
  caseReviewedAt: Date | string | null;
  createdAt: Date | string;
  author: { displayName: string; handle: string; verified: boolean; specialty: string | null };
  _count: { likes: number; replies: number };
};

export function AdminCasesClient({ cases }: { cases: AdminClinicalCase[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const act = (fn: () => Promise<void>) => {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  };

  const pendingCount = cases.filter((c) => !c.caseReviewedAt && !c.hidden).length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--eight-shell-bg)", fontFamily: "var(--font-body), system-ui, sans-serif" }}>
      <header className="px-6 py-4 border-b" style={{ background: "var(--eight-header-bg)", borderColor: LINE }}>
        <div className="mx-auto" style={{ maxWidth: 720 }}>
          <Link href="/feed" style={{ fontSize: 13, color: BLUE }}>← Voltar ao feed</Link>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: INK, marginTop: 4 }}>Moderação de casos clínicos</h1>
          <p style={{ fontSize: 14, color: MUTED }}>
            {pendingCount} pendente{pendingCount !== 1 ? "s" : ""} · {cases.length} no total
          </p>
        </div>
      </header>

      <main className="mx-auto px-6 py-6" style={{ maxWidth: 720 }}>
        {cases.length === 0 ? (
          <p className="text-center py-12" style={{ color: MUTED }}>Nenhum caso clínico publicado.</p>
        ) : (
          cases.map((c) => (
            <article
              key={c.id}
              className="rounded-xl border p-4 mb-4"
              style={{
                borderColor: LINE,
                background: CARD,
                opacity: c.hidden ? 0.75 : 1,
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <Link href={`/${c.author.handle}`} style={{ fontWeight: 700, color: INK, textDecoration: "none" }}>
                    {c.author.displayName}
                  </Link>
                  <span style={{ color: MUTED, fontSize: 13 }}> @{c.author.handle} · {timeAgo(new Date(c.createdAt))}</span>
                </div>
                <div className="flex flex-wrap gap-1 justify-end">
                  {c.hidden && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(224,89,48,.15)", color: ORANGE }}>
                      Oculto
                    </span>
                  )}
                  {c.caseReviewedAt ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(26,156,91,.15)", color: GREEN }}>
                      Revisado
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--eight-nav-active)", color: BLUE }}>
                      Pendente
                    </span>
                  )}
                </div>
              </div>

              {c.caseSpecialty && (
                <p style={{ fontSize: 13, color: BLUE, fontWeight: 600, marginBottom: 6 }}>
                  <Sparkles size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                  {c.caseSpecialty}
                </p>
              )}

              <p style={{ fontSize: 15, lineHeight: 1.5, color: INK, whiteSpace: "pre-wrap" }}>{c.body}</p>

              {c.caseTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.caseTags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--eight-surface-subtle)", color: MUTED }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <p style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>
                {c._count.likes} curtida{c._count.likes !== 1 ? "s" : ""} · {c._count.replies} resposta{c._count.replies !== 1 ? "s" : ""}
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                <Link
                  href={`/post/${c.id}`}
                  className="rounded-full px-3 py-1.5 font-semibold"
                  style={{ fontSize: 13, border: `1px solid ${LINE}`, color: BLUE, textDecoration: "none" }}
                >
                  Ver publicação
                </Link>
                {!c.caseReviewedAt && !c.hidden && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => act(() => adminReviewClinicalCase(c.id))}
                    className="flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold"
                    style={{ fontSize: 13, border: `1px solid ${LINE}`, background: CARD, color: GREEN, cursor: "pointer" }}
                  >
                    <CheckCircle size={14} /> Marcar como OK
                  </button>
                )}
                {!c.hidden ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (!confirm("Ocultar este caso para todos?")) return;
                      act(() => adminHideClinicalCase(c.id));
                    }}
                    className="flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold"
                    style={{ fontSize: 13, border: `1px solid ${LINE}`, background: CARD, color: ORANGE, cursor: "pointer" }}
                  >
                    <EyeOff size={14} /> Ocultar
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => act(() => adminRestoreClinicalCase(c.id))}
                    className="flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold"
                    style={{ fontSize: 13, border: `1px solid ${LINE}`, background: CARD, color: BLUE, cursor: "pointer" }}
                  >
                    <Eye size={14} /> Restaurar
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </main>
    </div>
  );
}
