"use client";

import { FormEvent, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import { useLocale } from "@/components/i18n/LocaleProvider";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();

  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!email || !token) {
    return (
      <div className="verify-banner">
        <p>{t("auth.resetInvalid")}</p>
        <p style={{ marginTop: 12 }}>
          <Link href="/login/esqueci-senha">{t("auth.forgotSubmit")}</Link>
        </p>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao redefinir.");
        return;
      }
      router.push("/login?reset=ok");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="auth">
      {error && <p className="signup-error" style={{ marginBottom: 8 }}>{error}</p>}
      <input
        className="field"
        type="password"
        placeholder={t("auth.newPassword")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoFocus
        minLength={8}
      />
      <input
        className="field"
        type="password"
        placeholder={t("auth.confirmPassword")}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        minLength={8}
      />
      <button type="submit" className="auth-btn btn-orange" disabled={loading}>
        {loading ? (
          <>
            <Loader2 size={18} className="spin" /> …
          </>
        ) : (
          t("auth.resetSubmit")
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
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

        <h1 className="h1" style={{ fontFamily: "var(--font-display)", fontSize: 32 }}>
          {t("auth.resetTitle")}
        </h1>
        <p className="lede" style={{ marginBottom: 24 }}>
          {t("auth.resetSubtitle")}
        </p>

        <Suspense fallback={<p className="lede">…</p>}>
          <ResetForm />
        </Suspense>

        <p className="signin" style={{ marginTop: 20 }}>
          <Link href="/login">← {t("auth.backToLogin")}</Link>
        </p>
      </div>
    </div>
  );
}
