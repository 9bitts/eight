"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Flag } from "lucide-react";
import { dismissReport, adminHidePost, adminSuspendProfile } from "@/lib/actions/reports";

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
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onDismiss = (reportId: string) => {
    startTransition(async () => {
      await dismissReport(reportId);
      router.refresh();
    });
  };

  const onHidePost = (reportId: string, postId: string) => {
    if (!confirm("Ocultar esta publicação para todos os usuários?")) return;
    startTransition(async () => {
      await adminHidePost(postId);
      await dismissReport(reportId);
      router.refresh();
    });
  };

  const onSuspendProfile = (reportId: string, profileId: string) => {
    if (!confirm("Suspender este perfil? O usuário não poderá mais usar a plataforma.")) return;
    startTransition(async () => {
      await adminSuspendProfile(profileId);
      await dismissReport(reportId);
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--eight-shell-bg)", color: INK }}>
      <header className="border-b px-6 py-4" style={{ borderColor: LINE, background: "var(--eight-card-bg)" }}>
        <Link href="/feed" style={{ color: MUTED, fontSize: 14, textDecoration: "none" }}>← Voltar</Link>
        <h1 style={{ fontWeight: 800, fontSize: 22, marginTop: 4 }}>Denúncias · Admin</h1>
        <p style={{ color: MUTED, fontSize: 14 }}>{reports.length} denúncia(s) pendentes</p>
      </header>

      {reports.length === 0 ? (
        <p className="p-8 text-center" style={{ color: MUTED }}>Nenhuma denúncia pendente.</p>
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
                <div className="flex gap-3 mt-3 items-center flex-wrap">
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
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onDismiss(r.id)}
                    className="rounded-full px-3 py-1 font-semibold"
                    style={{
                      fontSize: 12,
                      border: "1px solid var(--eight-line)",
                      background: "var(--eight-card-bg)",
                      color: "#176a88",
                      cursor: "pointer",
                    }}
                  >
                    Marcar como revisada
                  </button>
                  {r.targetType === "POST" && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onHidePost(r.id, r.targetId)}
                      className="rounded-full px-3 py-1 font-semibold"
                      style={{
                        fontSize: 12,
                        border: "1px solid #e05930",
                        background: "var(--eight-card-bg)",
                        color: "#e05930",
                        cursor: "pointer",
                      }}
                    >
                      Ocultar publicação
                    </button>
                  )}
                  {r.targetType === "PROFILE" && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onSuspendProfile(r.id, r.targetId)}
                      className="rounded-full px-3 py-1 font-semibold"
                      style={{
                        fontSize: 12,
                        border: "1px solid #e05930",
                        background: "var(--eight-card-bg)",
                        color: "#e05930",
                        cursor: "pointer",
                      }}
                    >
                      Suspender perfil
                    </button>
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
