"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, XCircle, Clock, FileText, Check, X, Loader2 } from "lucide-react";
import { approveVerification, rejectVerification } from "@/lib/actions/admin";
import { formatRegistration } from "@/lib/verification";
import { timeAgo } from "@/lib/format";

const BLUE = "#176a88";
const ORANGE = "#e05930";
const INK = "#0c2b36";
const LINE = "#e4ebee";

export type PendingProfile = {
  id: string;
  handle: string;
  displayName: string;
  specialty: string | null;
  registrationType: string | null;
  registrationNumber: string | null;
  registrationCountry: string | null;
  location: string | null;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  verificationDocumentUrl: string | null;
  verificationSubmittedAt: Date | string | null;
  user: { email: string; createdAt?: Date | string };
};

function PendingCard({ profile }: { profile: PendingProfile }) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const reg = formatRegistration(
    profile.registrationType,
    profile.registrationNumber,
    profile.registrationCountry
  );

  const approve = () => {
    startTransition(async () => {
      await approveVerification(profile.id);
      router.refresh();
    });
  };

  const reject = () => {
    startTransition(async () => {
      await rejectVerification(profile.id, reason);
      setRejecting(false);
      setReason("");
      router.refresh();
    });
  };

  return (
    <div className="rounded-xl border p-4 mb-4" style={{ borderColor: LINE, background: "#fff" }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, color: INK }}>{profile.displayName}</div>
          <div style={{ color: "#7a8f97", fontSize: 14 }}>@{profile.handle}</div>
          <div style={{ color: ORANGE, fontSize: 13, fontWeight: 600, marginTop: 4 }}>{profile.specialty}</div>
          <div style={{ fontSize: 13, color: "#516b75", marginTop: 2 }}>{reg}</div>
          {profile.location && (
            <div style={{ fontSize: 13, color: "#7a8f97" }}>{profile.location}</div>
          )}
          <div style={{ fontSize: 12, color: "#9fb0b6", marginTop: 6 }}>
            {profile.user.email}
            {profile.user.createdAt &&
              ` · cadastro ${timeAgo(new Date(profile.user.createdAt))}`}
            {profile.verificationSubmittedAt &&
              ` · enviado ${timeAgo(new Date(profile.verificationSubmittedAt))}`}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={approve}
            disabled={pending}
            className="flex items-center gap-1 rounded-full px-4 py-2 font-bold text-white"
            style={{ background: BLUE, border: "none", cursor: "pointer", fontSize: 13 }}
          >
            {pending ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
            Aprovar
          </button>
          <button
            type="button"
            onClick={() => setRejecting(!rejecting)}
            className="flex items-center gap-1 rounded-full px-4 py-2 font-bold"
            style={{ border: `1px solid ${LINE}`, background: "#fff", cursor: "pointer", fontSize: 13, color: ORANGE }}
          >
            <X size={16} /> Recusar
          </button>
        </div>
      </div>

      {profile.verificationDocumentUrl && (
        <a
          href={profile.verificationDocumentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-3 text-sm font-semibold"
          style={{ color: BLUE }}
        >
          <FileText size={16} /> Ver documento enviado
        </a>
      )}

      {rejecting && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: LINE }}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo da recusa (o profissional verá esta mensagem)…"
            rows={3}
            className="w-full border rounded-lg p-2 outline-none"
            style={{ borderColor: LINE, fontSize: 14 }}
          />
          <button
            type="button"
            onClick={reject}
            disabled={pending || reason.trim().length < 10}
            className="mt-2 rounded-full px-4 py-2 font-bold text-white"
            style={{ background: ORANGE, border: "none", cursor: "pointer", fontSize: 13, opacity: reason.trim().length >= 10 ? 1 : 0.5 }}
          >
            Confirmar recusa
          </button>
        </div>
      )}
    </div>
  );
}

export function AdminVerificationsClient({
  pending,
  recent,
}: {
  pending: PendingProfile[];
  recent: PendingProfile[];
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fa", fontFamily: "var(--font-body), system-ui, sans-serif" }}>
      <header className="sticky top-0 z-10 px-6 py-4 border-b" style={{ background: "#fff", borderColor: LINE }}>
        <div className="mx-auto flex items-center justify-between" style={{ maxWidth: 720 }}>
          <div>
            <Link href="/feed" style={{ fontSize: 13, color: BLUE }}>← Voltar ao feed</Link>
            <h1 style={{ fontWeight: 800, fontSize: 22, color: INK, marginTop: 4 }}>
              Verificações · Doctor8
            </h1>
            <p style={{ fontSize: 14, color: "#7a8f97" }}>Painel de aprovação do selo profissional</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "#eaf1f4", color: BLUE, fontWeight: 700, fontSize: 13 }}>
            <Clock size={16} /> {pending.length} pendente{pending.length !== 1 ? "s" : ""}
          </div>
        </div>
      </header>

      <main className="mx-auto px-6 py-6" style={{ maxWidth: 720 }}>
        {pending.length === 0 ? (
          <div className="text-center py-16" style={{ color: "#7a8f97" }}>
            <BadgeCheck size={48} style={{ color: BLUE, margin: "0 auto 12px" }} />
            <p>Nenhuma verificação pendente no momento.</p>
          </div>
        ) : (
          <>
            <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: INK }}>Aguardando análise</h2>
            {pending.map((p) => (
              <PendingCard key={p.id} profile={p} />
            ))}
          </>
        )}

        {recent.length > 0 && (
          <div className="mt-10">
            <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: INK }}>Analisados recentemente</h2>
            {recent.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-3 border-b" style={{ borderColor: LINE, fontSize: 14 }}>
                {p.verificationStatus === "VERIFIED" ? (
                  <BadgeCheck size={18} style={{ color: BLUE }} />
                ) : (
                  <XCircle size={18} style={{ color: ORANGE }} />
                )}
                <span style={{ fontWeight: 600, color: INK }}>{p.displayName}</span>
                <span style={{ color: "#7a8f97" }}>@{p.handle}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
