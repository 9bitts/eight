"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, Clock, XCircle, Upload, Loader2, FileText } from "lucide-react";
import {
  submitVerificationDocument,
  updateRegistrationInfo,
} from "@/lib/actions/verification";
import {
  VERIFICATION_LABELS,
  VERIFICATION_DESCRIPTIONS,
  formatRegistration,
} from "@/lib/verification";
import type { VerificationStatus } from "@prisma/client";

const BLUE = "#176a88";
const ORANGE = "#e05930";
const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const MUTED = "var(--eight-muted)";
const CARD = "var(--eight-card-bg)";

const REG_TYPES = [
  { value: "CRM", label: "CRM (médico)" },
  { value: "COREN", label: "COREN (enfermagem)" },
  { value: "CRP", label: "CRP (psicologia)" },
  { value: "CRO", label: "CRO (odontologia)" },
  { value: "CREFITO", label: "CREFITO (fisioterapia)" },
  { value: "CRN", label: "CRN (nutrição)" },
  { value: "OM", label: "OM / Licença médica (UE)" },
  { value: "NPI", label: "NPI / State license (EUA)" },
  { value: "OUTRO", label: "Outro registro profissional" },
];

const COUNTRIES = [
  { value: "BR", label: "Brasil" },
  { value: "PT", label: "Portugal" },
  { value: "US", label: "Estados Unidos" },
  { value: "OUTRO", label: "Outro país" },
];

type ProfileVerification = {
  displayName: string;
  handle: string;
  specialty: string;
  registrationType: string;
  registrationNumber: string;
  registrationCountry: string;
  verificationStatus: VerificationStatus;
  verificationDocumentUrl: string | null;
  rejectionReason: string | null;
  verified: boolean;
};

function StatusBanner({ status, reason }: { status: VerificationStatus; reason: string | null }) {
  const styles = {
    PENDING: { bg: "rgba(240,215,138,.15)", border: "rgba(240,215,138,.4)", color: "#c9a000", icon: Clock },
    VERIFIED: { bg: "var(--eight-nav-active)", border: "rgba(23,106,136,.35)", color: BLUE, icon: BadgeCheck },
    REJECTED: { bg: "rgba(224,89,48,.1)", border: "rgba(224,89,48,.3)", color: ORANGE, icon: XCircle },
  }[status];

  const Icon = styles.icon;

  return (
    <div className="rounded-xl p-4 mb-6 border" style={{ background: styles.bg, borderColor: styles.border }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={22} style={{ color: styles.color }} />
        <span style={{ fontWeight: 800, fontSize: 16, color: INK }}>{VERIFICATION_LABELS[status]}</span>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: MUTED }}>{VERIFICATION_DESCRIPTIONS[status]}</p>
      {status === "REJECTED" && reason && (
        <p className="mt-2 p-3 rounded-lg" style={{ background: CARD, fontSize: 13, color: INK }}>
          <strong>Motivo:</strong> {reason}
        </p>
      )}
    </div>
  );
}

export function VerificationClient({ profile }: { profile: ProfileVerification }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    specialty: profile.specialty,
    registrationType: profile.registrationType,
    registrationNumber: profile.registrationNumber,
    registrationCountry: profile.registrationCountry || "BR",
  });

  const uploadDoc = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/verification", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      startTransition(async () => {
        await submitVerificationDocument(json.key);
        router.refresh();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  };

  const saveRegistration = () => {
    setError("");
    startTransition(async () => {
      try {
        await updateRegistrationInfo(form);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao salvar");
      }
    });
  };

  const canEdit = profile.verificationStatus !== "VERIFIED";

  return (
    <div style={{ minHeight: "100vh", background: "var(--eight-shell-bg)", fontFamily: "var(--font-body), system-ui, sans-serif" }}>
      <header className="px-6 py-4 border-b" style={{ background: "var(--eight-header-bg)", borderColor: LINE }}>
        <div className="mx-auto" style={{ maxWidth: 560 }}>
          <Link href="/feed" style={{ fontSize: 13, color: BLUE }}>← Voltar ao feed</Link>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: INK, marginTop: 4 }}>Verificação profissional</h1>
          <p style={{ fontSize: 14, color: MUTED }}>
            @{profile.handle} · {formatRegistration(form.registrationType, form.registrationNumber, form.registrationCountry)}
          </p>
        </div>
      </header>

      <main className="mx-auto px-6 py-6" style={{ maxWidth: 560 }}>
        <StatusBanner status={profile.verificationStatus} reason={profile.rejectionReason} />
        {error && <p className="signup-error mb-4">{error}</p>}

        {canEdit && (
          <>
            <section className="rounded-xl border p-4 mb-4" style={{ borderColor: LINE, background: CARD }}>
              <h2 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: INK }}>Dados do registro</h2>
              <label className="signup-label">Especialidade</label>
              <input
                className="field signup-field"
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              />
              <label className="signup-label">Tipo de registro</label>
              <select
                className="field signup-field"
                value={form.registrationType}
                onChange={(e) => setForm({ ...form, registrationType: e.target.value })}
              >
                {REG_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <label className="signup-label">Número</label>
              <input
                className="field signup-field"
                value={form.registrationNumber}
                onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
              />
              <label className="signup-label">País</label>
              <select
                className="field signup-field"
                value={form.registrationCountry}
                onChange={(e) => setForm({ ...form, registrationCountry: e.target.value })}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={saveRegistration}
                disabled={pending}
                className="auth-btn btn-orange mt-3 w-full"
                style={{ border: "none", cursor: "pointer" }}
              >
                {pending ? "Salvando…" : "Atualizar e reenviar para análise"}
              </button>
            </section>

            <section className="rounded-xl border p-4" style={{ borderColor: LINE, background: CARD }}>
              <h2 style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: INK }}>
                Documento comprobatório (opcional)
              </h2>
              <p style={{ fontSize: 13, color: MUTED, marginBottom: 12, lineHeight: 1.45 }}>
                Envie foto ou PDF da carteira do CRM, COREN ou documento equivalente. Isso acelera a aprovação.
              </p>
              {profile.verificationDocumentUrl && (
                <a
                  href={profile.verificationDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mb-3 text-sm font-semibold"
                  style={{ color: BLUE }}
                >
                  <FileText size={16} /> Documento atual enviado
                </a>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadDoc(f);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || pending}
                className="flex items-center justify-center gap-2 w-full rounded-full py-3 font-bold"
                style={{ border: `1px solid ${LINE}`, background: CARD, cursor: "pointer", color: BLUE }}
              >
                {uploading ? <Loader2 size={18} className="spin" /> : <Upload size={18} />}
                {uploading ? "Enviando…" : "Enviar documento"}
              </button>
            </section>
          </>
        )}

        {profile.verificationStatus === "VERIFIED" && (
          <div className="text-center py-8">
            <BadgeCheck size={56} style={{ color: BLUE, margin: "0 auto 12px" }} fill={BLUE} stroke="#fff" />
            <p style={{ fontWeight: 700, fontSize: 18, color: INK }}>Selo verificado ativo</p>
            <p style={{ color: MUTED, marginTop: 8 }}>O selo azul aparece em todas as suas publicações.</p>
          </div>
        )}
      </main>
    </div>
  );
}
