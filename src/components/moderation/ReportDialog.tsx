"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { submitReport } from "@/lib/actions/reports";

const REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "HARASSMENT", label: "Assédio" },
  { value: "MISINFORMATION", label: "Informação falsa" },
  { value: "PRIVACY", label: "Violação de privacidade" },
  { value: "OTHER", label: "Outro" },
] as const;

type ReportTarget = "POST" | "PROFILE";

export function ReportDialog({
  targetType,
  targetId,
  onClose,
}: {
  targetType: ReportTarget;
  targetId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<(typeof REASONS)[number]["value"]>("SPAM");
  const [details, setDetails] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async () => {
    setPending(true);
    setError("");
    try {
      await submitReport(targetType, targetId, reason, details);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao denunciar.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-5"
        style={{ background: "var(--eight-card-bg)", border: "1px solid var(--eight-line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <Flag size={18} style={{ color: "#e05930" }} />
          <h3 style={{ fontWeight: 800, fontSize: 16, color: "var(--eight-ink)" }}>Denunciar</h3>
        </div>

        {done ? (
          <p style={{ color: "var(--eight-muted)", fontSize: 14 }}>
            Denúncia registrada. Nossa equipe irá analisar.
          </p>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "var(--eight-muted)", marginBottom: 12 }}>
              {targetType === "POST"
                ? "Por que você está denunciando esta publicação?"
                : "Por que você está denunciando este perfil?"}
            </p>
            <div className="space-y-2 mb-3">
              {REASONS.map((r) => (
                <label
                  key={r.value}
                  className="flex items-center gap-2 cursor-pointer"
                  style={{ fontSize: 14, color: "var(--eight-ink)" }}
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                  />
                  {r.label}
                </label>
              ))}
            </div>
            <textarea
              className="field field-app w-full"
              rows={2}
              placeholder="Detalhes (opcional)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
            />
            {error && <p className="mt-2 text-sm" style={{ color: "#e05930" }}>{error}</p>}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
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
                disabled={pending}
                className="flex-1 rounded-full py-2 font-bold text-white"
                style={{ background: "#e05930", border: "none", cursor: "pointer", opacity: pending ? 0.6 : 1 }}
              >
                Enviar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
