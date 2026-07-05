"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { getSession, signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { redirectAfterAuth, resolvePostAuthRedirect, sanitizeCallbackUrl } from "@/lib/auth-redirect";

export function EmailLoginForm({
  callbackUrl = "/feed",
  resetOk = false,
}: {
  callbackUrl?: string;
  resetOk?: boolean;
}) {
  const { t } = useLocale();
  const safeCallback = sanitizeCallbackUrl(callbackUrl);
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

      const session = await getSession();
      const dest = resolvePostAuthRedirect(
        safeCallback,
        !!session?.user?.profileId
      );
      redirectAfterAuth(dest);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="auth">
      {resetOk && (
        <p className="signup-hint ok" style={{ marginBottom: 8 }}>
          {t("auth.resetSuccess")}
        </p>
      )}
      {error && (
        <p className="signup-error" style={{ marginBottom: 8 }}>
          {error}
        </p>
      )}
      <input
        className="field"
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <input
        className="field"
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
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
  );
}
