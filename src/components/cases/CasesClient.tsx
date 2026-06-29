"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { FeedShell } from "@/components/feed/FeedShell";
import { PostCard } from "@/components/feed/PostCard";
import { createClinicalCase } from "@/lib/actions/cases";
import { CASE_TAG_OPTIONS } from "@/lib/cases";
import type { FeedPost, SessionUser } from "@/lib/types";

const INK = "#0c2b36";
const LINE = "#e4ebee";
const BLUE = "#176a88";
const ORANGE = "#e05930";

function CaseComposer({ specialty }: { specialty: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [caseSpecialty, setCaseSpecialty] = useState(specialty);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const toggleTag = (tag: string) => {
    setTags((t) =>
      t.includes(tag) ? t.filter((x) => x !== tag) : t.length < 5 ? [...t, tag] : t
    );
  };

  const publish = () => {
    setError("");
    startTransition(async () => {
      try {
        await createClinicalCase({
          body,
          tags,
          specialty: caseSpecialty,
          confirmedAnonymized: confirmed,
        });
        setBody("");
        setTags([]);
        setConfirmed(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao publicar");
      }
    });
  };

  return (
    <div className="mx-4 mt-4 mb-2 p-4 rounded-xl border" style={{ borderColor: LINE, background: "#f9fbfc" }}>
      <h2 style={{ fontWeight: 700, fontSize: 15, color: INK, marginBottom: 8 }}>Novo caso clínico</h2>
      <p style={{ fontSize: 12.5, color: "#516b75", lineHeight: 1.45, marginBottom: 12 }}>
        Descreva o caso sem nomes, documentos ou dados que identifiquem o paciente. Use idade, sexo e achados clínicos.
      </p>
      <input
        className="field signup-field mb-2"
        placeholder="Especialidade do caso"
        value={caseSpecialty}
        onChange={(e) => setCaseSpecialty(e.target.value)}
      />
      <textarea
        className="w-full border rounded-xl p-3 outline-none mb-2"
        style={{ borderColor: LINE, fontSize: 15, minHeight: 100 }}
        placeholder="Ex.: Paciente masculino, 52 anos, dor torácica há 2h, sem antecedentes conhecidos…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={500}
      />
      <div className="flex flex-wrap gap-2 mb-3">
        {CASE_TAG_OPTIONS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className="rounded-full px-3 py-1 text-sm font-semibold"
            style={{
              border: `1px solid ${tags.includes(tag) ? BLUE : LINE}`,
              background: tags.includes(tag) ? "#e8f4f8" : "#fff",
              color: tags.includes(tag) ? BLUE : "#516b75",
              cursor: "pointer",
            }}
          >
            {tag}
          </button>
        ))}
      </div>
      <label className="flex items-start gap-2 mb-3 cursor-pointer" style={{ fontSize: 13, color: "#516b75" }}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          style={{ marginTop: 3, accentColor: BLUE }}
        />
        Confirmo que o caso está anonimizado e não contém dados identificáveis do paciente.
      </label>
      {error && <p className="signup-error mb-2">{error}</p>}
      <button
        type="button"
        onClick={publish}
        disabled={pending || !confirmed || !body.trim()}
        className="auth-btn btn-orange w-full"
        style={{ border: "none", cursor: "pointer", opacity: confirmed && body.trim() ? 1 : 0.6 }}
      >
        {pending ? "Publicando…" : "Publicar caso"}
      </button>
    </div>
  );
}

export function CasesClient({
  user,
  notificationCount,
  posts,
  canPost,
  userSpecialty,
}: {
  user: SessionUser;
  notificationCount: number;
  posts: FeedPost[];
  canPost: boolean;
  userSpecialty: string;
}) {
  return (
    <FeedShell user={user} notificationCount={notificationCount}>
      <main className="flex-1 min-w-0" style={{ maxWidth: 620, background: "#fff", borderRight: `1px solid ${LINE}` }}>
        <div className="sticky top-0 z-10 px-4 py-3" style={{ borderBottom: `1px solid ${LINE}`, background: "#fff" }}>
          <div className="flex items-center gap-2">
            <Sparkles size={22} style={{ color: ORANGE }} />
            <h1 style={{ fontWeight: 800, fontSize: 20, color: INK }}>Casos clínicos</h1>
          </div>
          <p style={{ fontSize: 13, color: "#7a8f97", marginTop: 6, lineHeight: 1.45 }}>
            Discussão entre profissionais verificados. Sem identificação de pacientes — moderação automática de dados sensíveis.
          </p>
        </div>

        {!canPost && (
          <div className="mx-4 mt-4 p-4 rounded-xl" style={{ background: "#fff8e6", border: "1px solid #f0d78a" }}>
            <p style={{ fontSize: 14, color: INK }}>
              Publicar casos requer o selo verificado.{" "}
              <a href="/verificacao" style={{ color: BLUE, fontWeight: 600 }}>Verificar perfil →</a>
            </p>
          </div>
        )}

        {canPost && <CaseComposer specialty={userSpecialty} />}

        {posts.length === 0 ? (
          <p className="px-4 py-12 text-center" style={{ color: "#7a8f97" }}>
            Nenhum caso publicado ainda. Seja o primeiro a abrir uma discussão.
          </p>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </main>
    </FeedShell>
  );
}
