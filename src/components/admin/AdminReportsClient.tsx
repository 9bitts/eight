"use client";

import Link from "next/link";
import { Flag } from "lucide-react";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const MUTED = "var(--eight-muted)";

const REASON_LABELS: Record<string, string> = {
  SPAM: "Spam",
  HARASSMENT: "Assédio",
  MISINFORMATION: "Informação falsa",
  PRIVACY: "Privacidade",
  OTHER: "Outro",
};

export type AdminReport = {
  id: string;
  targetType: "POST" | "PROFILE";
  targetId: string;
  reason: string;
  details: string | null;
  createdAt: Date | string;
  reporter: { displayName: string; handle: string };
  targetHandle: string | null;
};

export function AdminReportsClient({ reports }: { reports: AdminReport[] }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--eight-shell-bg)", color: INK }}>
      <header className="border-b px-6 py-4" style={{ borderColor: LINE, background: "var(--eight-card-bg)" }}>
        <Link href="/feed" style={{ color: MUTED, fontSize: 14, textDecoration: "none" }}>← Voltar</Link>
        <h1 style={{ fontWeight: 800, fontSize: 22, marginTop: 4 }}>Denúncias · Admin</h1>
        <p style={{ color: MUTED, fontSize: 14 }}>{reports.length} denúncia(s) recentes</p>
      </header>

      {reports.length === 0 ? (
        <p className="p-8 text-center" style={{ color: MUTED }}>Nenhuma denúncia registrada.</p>
      ) : (
        reports.map((r) => (
          <div key={r.id} className="border-b px-6 py-4" style={{ borderColor: LINE, background: "var(--eight-card-bg)" }}>
            <div className="flex items-start gap-3">
              <Flag size={18} style={{ color: "#e05930", marginTop: 2 }} />
              <div className="flex-1">
                <div style={{ fontWeight: 700 }}>
                  {r.targetType === "POST" ? "Publicação" : "Perfil"} · {REASON_LABELS[r.reason] ?? r.reason}
                </div>
                <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
                  Por @{r.reporter.handle} · {new Date(r.createdAt).toLocaleString("pt-BR")}
                </div>
                {r.details && (
                  <p style={{ fontSize: 14, marginTop: 8, color: "var(--eight-body-text)" }}>{r.details}</p>
                )}
                <div className="flex gap-3 mt-3">
                  {r.targetType === "POST" ? (
                    <Link href={`/post/${r.targetId}`} style={{ color: "#176a88", fontWeight: 600, fontSize: 13 }}>
                      Ver publicação →
                    </Link>
                  ) : r.targetHandle ? (
                    <Link href={`/${r.targetHandle}`} style={{ color: "#176a88", fontWeight: 600, fontSize: 13 }}>
                      Ver perfil →
                    </Link>
                  ) : (
                    <span style={{ color: MUTED, fontSize: 13 }}>Perfil removido</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
