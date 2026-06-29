"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { BadgeCheck, ArrowLeft, ArrowRight, Loader2, Check, X } from "lucide-react";
import Logo from "@/components/Logo";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { normalizeHandle, handleError } from "@/lib/validators";

const BLUE = "#176a88";
const ORANGE = "#e05930";
const INK = "#0a242e";

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
  email: string;
  password: string;
  handle: string;
  specialty: string;
  registrationType: string;
  registrationNumber: string;
  registrationCountry: string;
  location: string;
};

const INITIAL: FormData = {
  displayName: "",
  email: "",
  password: "",
  handle: "",
  specialty: "",
  registrationType: "CRM",
  registrationNumber: "",
  registrationCountry: "BR",
  location: "",
};

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="step-dots" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={i + 1 === step ? "dot active" : i + 1 < step ? "dot done" : "dot"} />
      ))}
    </div>
  );
}

function StepAccount({
  data,
  onChange,
  onNext,
}: {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  onNext: () => void;
}) {
  const [error, setError] = useState("");

  const next = () => {
    setError("");
    if (!data.displayName.trim() || data.displayName.trim().length < 2) {
      setError("Informe seu nome completo.");
      return;
    }
    if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (data.password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    onNext();
  };

  return (
    <div>
      <h2 className="signup-title" style={{ fontFamily: "var(--font-display)" }}>
        Crie sua conta
      </h2>
      <p className="signup-sub">Passo 1 de 3 — cadastro com e-mail.</p>

      <OAuthButtons mode="signup" callbackUrl="/feed" />
      <div className="divider" style={{ margin: "16px 0" }}>ou com e-mail</div>

      {error && <p className="signup-error">{error}</p>}

      <label className="signup-label">Nome completo</label>
      <input
        className="field signup-field"
        type="text"
        placeholder="Dra. Ana Beltrão"
        value={data.displayName}
        onChange={(e) => onChange({ displayName: e.target.value })}
        autoFocus
      />

      <label className="signup-label">E-mail profissional</label>
      <input
        className="field signup-field"
        type="email"
        placeholder="voce@clinica.com"
        value={data.email}
        onChange={(e) => onChange({ email: e.target.value })}
      />

      <label className="signup-label">Senha</label>
      <input
        className="field signup-field"
        type="password"
        placeholder="Mínimo 8 caracteres"
        value={data.password}
        onChange={(e) => onChange({ password: e.target.value })}
      />

      <button type="button" className="auth-btn btn-orange signup-next" onClick={next}>
        Avançar <ArrowRight size={18} />
      </button>
    </div>
  );
}

function StepHandle({
  data,
  onChange,
  onBack,
  onNext,
}: {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  const handle = normalizeHandle(data.handle);

  const checkHandle = useCallback(async (h: string) => {
    const err = handleError(h);
    if (err) {
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
    if (!handle) {
      setAvailable(null);
      return;
    }
    const t = setTimeout(() => checkHandle(handle), 400);
    return () => clearTimeout(t);
  }, [handle, checkHandle]);

  const next = () => {
    setError("");
    const err = handleError(handle);
    if (err) {
      setError(err);
      return;
    }
    if (available !== true) {
      setError("Este @nome não está disponível.");
      return;
    }
    onChange({ handle });
    onNext();
  };

  return (
    <div>
      <h2 className="signup-title" style={{ fontFamily: "var(--font-display)" }}>
        Escolha seu @nome
      </h2>
      <p className="signup-sub">Passo 2 de 3 — é como seu perfil aparece na rede.</p>

      {error && <p className="signup-error">{error}</p>}

      <label className="signup-label">Nome de usuário</label>
      <div className="handle-row">
        <span className="handle-prefix">@</span>
        <input
          className="field signup-field handle-input"
          type="text"
          placeholder="anabeltrao"
          value={data.handle}
          onChange={(e) => onChange({ handle: normalizeHandle(e.target.value) })}
          autoFocus
        />
        <span className="handle-status">
          {checking && <Loader2 size={18} className="spin" />}
          {!checking && available === true && <Check size={18} color="#1a9c5b" />}
          {!checking && available === false && <X size={18} color="#e05930" />}
        </span>
      </div>
      {available === true && <p className="signup-hint ok">@{handle} está disponível</p>}
      {available === false && <p className="signup-hint bad">@{handle} já está em uso</p>}

      <div className="signup-actions">
        <button type="button" className="auth-btn btn-line signup-back" onClick={onBack}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <button type="button" className="auth-btn btn-orange signup-next-inline" onClick={next}>
          Avançar <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

function StepProfessional({
  data,
  onChange,
  onBack,
  onSubmit,
  loading,
}: {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const [error, setError] = useState("");

  const submit = () => {
    setError("");
    if (!data.specialty.trim()) {
      setError("Informe sua especialidade ou área de atuação.");
      return;
    }
    if (!data.registrationNumber.trim()) {
      setError("Informe o número do seu registro profissional.");
      return;
    }
    onSubmit();
  };

  return (
    <div>
      <h2 className="signup-title" style={{ fontFamily: "var(--font-display)" }}>
        Seu perfil profissional
      </h2>
      <p className="signup-sub">Passo 3 de 3 — dados para verificação do selo azul.</p>

      <div className="verify-banner">
        <BadgeCheck size={22} style={{ color: BLUE, flexShrink: 0 }} />
        <p>
          Seu selo <strong>verificado</strong> será liberado após conferirmos o registro.
          Enquanto isso, você já pode explorar a rede.
        </p>
      </div>

      {error && <p className="signup-error">{error}</p>}

      <label className="signup-label">Especialidade / área</label>
      <input
        className="field signup-field"
        type="text"
        placeholder="Cardiologia, Enfermagem, Psicologia…"
        value={data.specialty}
        onChange={(e) => onChange({ specialty: e.target.value })}
        autoFocus
      />

      <label className="signup-label">Tipo de registro</label>
      <select
        className="field signup-field"
        value={data.registrationType}
        onChange={(e) => onChange({ registrationType: e.target.value })}
      >
        {REG_TYPES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      <label className="signup-label">Número do registro</label>
      <input
        className="field signup-field"
        type="text"
        placeholder="Ex: 123456 / SP"
        value={data.registrationNumber}
        onChange={(e) => onChange({ registrationNumber: e.target.value })}
      />

      <label className="signup-label">País do registro</label>
      <select
        className="field signup-field"
        value={data.registrationCountry}
        onChange={(e) => onChange({ registrationCountry: e.target.value })}
      >
        {COUNTRIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <label className="signup-label">Cidade (opcional)</label>
      <input
        className="field signup-field"
        type="text"
        placeholder="São Paulo, Lisboa, Boston…"
        value={data.location}
        onChange={(e) => onChange({ location: e.target.value })}
      />

      <div className="signup-actions">
        <button type="button" className="auth-btn btn-line signup-back" onClick={onBack} disabled={loading}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <button
          type="button"
          className="auth-btn btn-orange signup-next-inline"
          onClick={submit}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="spin" /> Criando conta…
            </>
          ) : (
            <>
              Criar conta <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const patch = (p: Partial<FormData>) => setData((d) => ({ ...d, ...p }));

  const finish = async () => {
    setLoading(true);
    setGlobalError("");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setGlobalError(json.error ?? "Erro ao criar conta.");
        setLoading(false);
        return;
      }

      const signInRes = await signIn("credentials", {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        redirect: false,
      });

      if (signInRes?.error) {
        setGlobalError("Conta criada! Faça login para continuar.");
        router.push("/login");
        return;
      }

      router.push("/feed");
      router.refresh();
    } catch {
      setGlobalError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="signup-wrap" style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}>
      <div className="signup-top">
        <Link href="/" className="signup-logo">
          <Logo size={28} />
          <b style={{ fontFamily: "var(--font-display)", color: "var(--txt)" }}>eight</b>
        </Link>
        <p className="signup-top-link">
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </div>

      <div className="signup-card">
        <StepDots step={step} total={3} />
        {globalError && <p className="signup-error">{globalError}</p>}

        {step === 1 && (
          <StepAccount data={data} onChange={patch} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <StepHandle
            data={data}
            onChange={patch}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepProfessional
            data={data}
            onChange={patch}
            onBack={() => setStep(2)}
            onSubmit={finish}
            loading={loading}
          />
        )}
      </div>

      <p className="signup-legal">
        Ao criar conta, você concorda com os Termos e a Política de Privacidade da eight.
        Registro profissional sujeito a verificação.
      </p>
    </div>
  );
}
