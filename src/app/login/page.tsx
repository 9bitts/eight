"use client";

import { Suspense, useState, FormEvent, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { redirectAfterAuth, sanitizeCallbackUrl } from "@/lib/auth-redirect";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLocale();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));
  const resetOk = searchParams.get("reset") === "ok";

  useEffect(() => {
    const raw = searchParams.get("callbackUrl");
    if (!raw) return;
    const safe = sanitizeCallbackUrl(raw);
    if (raw === safe) return;
    const params = new URLSearchParams();
    if (safe !== "/feed") params.set("callbackUrl", safe);
    const reset = searchParams.get("reset");
    if (reset) params.set("reset", reset);
    const qs = params.toString();
    router.replace(qs ? `/login?${qs}` : "/login");
  }, [searchParams, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

      const res = await signIn("credentials", {
        email: normalized,
        password,
        redirect: false,
      });

      if (!res?.ok) {
        setError("E-mail ou senha incorretos.");
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
      <form onSubmit={onSubmit} className="auth">
        {resetOk && (
          <p className="signup-hint ok" style={{ marginBottom: 8 }}>
            {t("auth.resetSuccess")}
          </p>
        )}
        {error && <p className="signup-error" style={{ marginBottom: 8 }}>{error}</p>}
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
        <button type="submit" className="auth-btn btn-orange" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={18} className="spin" /> …
            </>
          ) : (
            t("auth.emailLogin")
          )}
        </button>
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
