"use client";

import { Suspense, useState, FormEvent, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { redirectAfterAuth, sanitizeCallbackUrl } from "@/lib/auth-redirect";

function LoginContent() {
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));
  const resetOk = searchParams.get("reset") === "ok";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [needs2fa, setNeeds2fa] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || loading) return;
    setError("");
    setLoading(true);
    submittingRef.current = true;

    try {
      const normalized = email.trim().toLowerCase();

      if (!needs2fa) {
        const check = await fetch("/api/auth/check-2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalized, password }),
        });
        const data = await check.json();
        if (data.needs2fa) {
          setNeeds2fa(true);
          return;
        }
      }

      const res = await signIn("credentials", {
        email: normalized,
        password,
        totp: needs2fa ? totp : "",
        redirect: false,
      });

      if (!res?.ok) {
        setError(
          needs2fa
            ? "Código 2FA inválido ou senha incorreta."
            : "E-mail ou senha incorretos."
        );
        return;
      }

      await getSession();
      redirectAfterAuth(callbackUrl);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <>
      <OAuthButtons mode="login" callbackUrl={callbackUrl} />
      <div className="divider">{t("auth.orEmail")}</div>
      <form onSubmit={onSubmit} className="auth">
        {resetOk && (
          <p className="signup-hint ok" style={{ marginBottom: 8 }}>
            {t("auth.resetSuccess")}
          </p>
        )}
        {error && <p className="signup-error" style={{ marginBottom: 8 }}>{error}</p>}
        {!needs2fa && (
          <>
            <input
              className="field"
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <input
              className="field"
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p style={{ textAlign: "right", marginTop: -4, marginBottom: 8 }}>
              <Link href="/login/esqueci-senha" style={{ fontSize: 13, color: "#4aa9c6" }}>
                {t("auth.forgotPassword")}
              </Link>
            </p>
          </>
        )}
        {needs2fa && (
          <>
            <p style={{ fontSize: 13, color: "#516b75", marginBottom: 8 }}>{t("auth.totpHint")}</p>
            <input
              className="field"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={t("auth.totpCode")}
              value={totp}
              onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              autoFocus
            />
          </>
        )}
        <button type="submit" className="auth-btn btn-orange" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={18} className="spin" /> …
            </>
          ) : (
            t("auth.emailLogin")
          )}
        </button>
        {needs2fa && (
          <button
            type="button"
            className="mt-2 text-sm"
            style={{ background: "none", border: "none", color: "#176a88", cursor: "pointer" }}
            onClick={() => {
              setNeeds2fa(false);
              setTotp("");
            }}
          >
            ← Voltar
          </button>
        )}
      </form>
    </>
  );
}

export default function LoginPage() {
  const { t } = useLocale();

  return (
    <div
      className="screen"
      style={{ fontFamily: "var(--font-body), system-ui, sans-serif", gridTemplateColumns: "1fr" }}
    >
      <div className="left" style={{ maxWidth: 420, margin: "0 auto", width: "100%" }}>
        <div className="brand">
          <Logo size={34} />
          <b style={{ fontFamily: "var(--font-display)" }}>eight</b>
        </div>

        <h1 className="h1" style={{ fontFamily: "var(--font-display)", fontSize: 36 }}>
          {t("auth.login")}
        </h1>
        <p className="lede" style={{ marginBottom: 28 }}>
          {t("auth.loginSubtitle")}
        </p>

        <Suspense fallback={<p className="lede">…</p>}>
          <LoginContent />
        </Suspense>

        <p className="signin">
          {t("auth.noAccount")} <Link href="/signup">{t("auth.signup")}</Link>
        </p>
        <p className="signin" style={{ marginTop: 12 }}>
          <Link href="/">← Voltar ao início</Link>
        </p>
      </div>
    </div>
  );
}
