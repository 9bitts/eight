"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createInvitesFromList } from "@/lib/actions/invites";

const BLUE = "#176a88";
const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const MUTED = "var(--eight-muted)";
const CARD = "var(--eight-card-bg)";
const ORANGE = "#e05930";

type InviteRow = {
  id: string;
  email: string;
  code: string;
  usedAt: Date | string | null;
  emailSentAt: Date | string | null;
  createdAt: Date | string;
  createdBy: { email: string } | null;
};

export function AdminInvitesClient({
  invites,
  emailConfigured,
}: {
  invites: InviteRow[];
  emailConfigured: boolean;
}) {
  const router = useRouter();
  const [emails, setEmails] = useState("");
  const [sendEmails, setSendEmails] = useState(true);
  const [result, setResult] = useState<{ email: string; code: string; sent: boolean }[] | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const site = typeof window !== "undefined" ? window.location.origin : "https://doctor8.com.br";

  const submit = () => {
    setError("");
    setResult(null);
    startTransition(async () => {
      try {
        const rows = await createInvitesFromList(emails, sendEmails);
        setResult(rows);
        setEmails("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      }
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--eight-shell-bg)", fontFamily: "var(--font-body), system-ui, sans-serif" }}>
      <header className="sticky top-0 z-10 px-6 py-4 border-b" style={{ background: "var(--eight-header-bg)", borderColor: LINE }}>
        <div className="mx-auto" style={{ maxWidth: 720 }}>
          <Link href="/feed" style={{ fontSize: 13, color: BLUE }}>← Voltar ao feed</Link>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: INK, marginTop: 4 }}>Convites · Doctor8</h1>
          <p style={{ fontSize: 14, color: MUTED }}>
            Envie convites para profissionais entrarem na eight
          </p>
          {!emailConfigured && (
            <p className="mt-2 p-3 rounded-lg" style={{ background: "var(--eight-surface-subtle)", fontSize: 13, color: "#8a6d00" }}>
              SMTP não configurado — convites serão criados, mas e-mails não serão enviados automaticamente.
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto px-6 py-6" style={{ maxWidth: 720 }}>
        <div className="rounded-xl border p-4 mb-6" style={{ borderColor: LINE, background: CARD }}>
          <label className="signup-label">E-mails (um por linha ou separados por vírgula)</label>
          <textarea
            className="w-full border rounded-lg p-3 outline-none"
            style={{ borderColor: LINE, fontSize: 14, minHeight: 120 }}
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder={"dr.silva@clinica.com\ndra.maria@hospital.com"}
          />
          <label className="flex items-center gap-2 mt-3 cursor-pointer" style={{ fontSize: 14 }}>
            <input
              type="checkbox"
              checked={sendEmails}
              onChange={(e) => setSendEmails(e.target.checked)}
              style={{ accentColor: BLUE }}
            />
            Enviar e-mail automaticamente (se SMTP configurado)
          </label>
          {error && <p className="signup-error mt-2">{error}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={pending || !emails.trim()}
            className="auth-btn btn-orange mt-3"
            style={{ border: "none", cursor: "pointer" }}
          >
            {pending ? "Criando…" : "Gerar convites"}
          </button>
        </div>

        {result && result.length > 0 && (
          <div className="rounded-xl border p-4 mb-6" style={{ borderColor: LINE, background: "var(--eight-nav-active)" }}>
            <h2 style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{result.length} convite(s) criado(s)</h2>
            {result.map((r) => (
              <div key={r.code} style={{ fontSize: 13, marginBottom: 6 }}>
                <strong>{r.email}</strong>
                {r.sent && <span style={{ color: "#1a9c5b" }}> · e-mail enviado</span>}
                <br />
                <code style={{ fontSize: 12 }}>{site}/signup?invite={r.code}</code>
              </div>
            ))}
          </div>
        )}

        <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: INK }}>Convites recentes</h2>
        {invites.length === 0 ? (
          <p style={{ color: MUTED }}>Nenhum convite ainda.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: LINE, background: CARD }}>
            {invites.map((inv) => (
              <div key={inv.id} className="px-4 py-3 border-b" style={{ borderColor: LINE, fontSize: 14 }}>
                <div style={{ fontWeight: 600, color: INK }}>{inv.email}</div>
                <div style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>
                  {inv.usedAt ? (
                    <span style={{ color: "#1a9c5b" }}>Utilizado</span>
                  ) : (
                    <span>Pendente · <code>{inv.code.slice(0, 8)}…</code></span>
                  )}
                  {inv.emailSentAt && " · e-mail enviado"}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
