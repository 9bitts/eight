"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Check, X } from "lucide-react";
import Logo from "@/components/Logo";
import { normalizeHandle, handleError } from "@/lib/validators";

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

type FormData = {
  displayName: string;
  handle: string;
  specialty: string;
  registrationType: string;
  registrationNumber: string;
  registrationCountry: string;
  location: string;
};

function CompleteForm({
  initialName,
  suggestedHandle,
}: {
  initialName: string;
  suggestedHandle: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<FormData>({
    displayName: initialName,
    handle: suggestedHandle,
    specialty: "",
    registrationType: "CRM",
    registrationNumber: "",
    registrationCountry: "BR",
    location: "",
  });

  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const handle = normalizeHandle(data.handle);

  const checkHandle = useCallback(async (h: string) => {
    if (handleError(h)) {
      setAvailable(null);
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(`/api/handle/check?handle=${encodeURIComponent(h)}`);
      const json = await res.json();
      setAvailable(json.available === true);
    } catch {
      setAvailable(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!handle || step !== 1) return;
    const t = setTimeout(() => checkHandle(handle), 400);
    return () => clearTimeout(t);
  }, [handle, step, checkHandle]);

  const finish = async () => {
    setError("");
    if (!data.specialty.trim() || !data.registrationNumber.trim()) {
      setError("Preencha especialidade e registro profissional.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/signup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao salvar perfil.");
        setLoading(false);
        return;
      }
      router.push("/feed");
      router.refresh();
    } catch {
      setError("Erro de conexão.");
      setLoading(false);
    }
  };

  return (
    <div className="signup-card">
      <div className="step-dots" aria-hidden="true">
        <span className={step === 1 ? "dot active" : "dot done"} />
        <span className={step === 2 ? "dot active" : "dot"} />
      </div>

      {error && <p className="signup-error">{error}</p>}

      {step === 1 && (
        <div>
          <h2 className="signup-title" style={{ fontFamily: "var(--font-display)" }}>
            Escolha seu @nome
          </h2>
          <p className="signup-sub">
            Você entrou com a Doctor8. Falta só configurar seu perfil profissional na eight.
          </p>

          <label className="signup-label">Nome de exibição</label>
          <input
            className="field signup-field"
            value={data.displayName}
            onChange={(e) => setData({ ...data, displayName: e.target.value })}
          />

          <label className="signup-label">Nome de usuário</label>
          <div className="handle-row">
            <span className="handle-prefix">@</span>
            <input
              className="field signup-field handle-input"
              value={data.handle}
              onChange={(e) => setData({ ...data, handle: normalizeHandle(e.target.value) })}
            />
            <span className="handle-status">
              {checking && <Loader2 size={18} className="spin" />}
              {!checking && available === true && <Check size={18} color="#1a9c5b" />}
              {!checking && available === false && <X size={18} color="#e05930" />}
            </span>
          </div>

          <button
            type="button"
            className="auth-btn btn-orange signup-next"
            onClick={() => {
              const err = handleError(handle);
              if (err) { setError(err); return; }
              if (available !== true) { setError("@nome indisponível."); return; }
              setError("");
              setStep(2);
            }}
          >
            Avançar <ArrowRight size={18} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="signup-title" style={{ fontFamily: "var(--font-display)" }}>
            Perfil profissional
          </h2>
          <p className="signup-sub">Dados para verificação do selo azul.</p>

          <label className="signup-label">Especialidade</label>
          <input
            className="field signup-field"
            value={data.specialty}
            onChange={(e) => setData({ ...data, specialty: e.target.value })}
          />

          <label className="signup-label">Tipo de registro</label>
          <select
            className="field signup-field"
            value={data.registrationType}
            onChange={(e) => setData({ ...data, registrationType: e.target.value })}
          >
            {REG_TYPES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <label className="signup-label">Número do registro</label>
          <input
            className="field signup-field"
            value={data.registrationNumber}
            onChange={(e) => setData({ ...data, registrationNumber: e.target.value })}
          />

          <label className="signup-label">País</label>
          <select
            className="field signup-field"
            value={data.registrationCountry}
            onChange={(e) => setData({ ...data, registrationCountry: e.target.value })}
          >
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <label className="signup-label">Cidade (opcional)</label>
          <input
            className="field signup-field"
            value={data.location}
            onChange={(e) => setData({ ...data, location: e.target.value })}
          />

          <div className="signup-actions">
            <button type="button" className="auth-btn btn-line signup-back" onClick={() => setStep(1)}>
              <ArrowLeft size={18} /> Voltar
            </button>
            <button
              type="button"
              className="auth-btn btn-orange signup-next-inline"
              onClick={finish}
              disabled={loading}
            >
              {loading ? "Salvando…" : "Entrar na eight"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CompleteSignupClient({
  displayName,
  suggestedHandle,
}: {
  displayName: string;
  suggestedHandle: string;
}) {
  return (
    <div className="signup-wrap" style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}>
      <div className="signup-top">
        <Link href="/" className="signup-logo">
          <Logo size={28} />
          <b style={{ fontFamily: "var(--font-display)", color: "var(--txt)" }}>eight</b>
        </Link>
      </div>
      <CompleteForm initialName={displayName} suggestedHandle={suggestedHandle} />
    </div>
  );
}
