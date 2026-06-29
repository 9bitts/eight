"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import { useLocale } from "@/components/i18n/LocaleProvider";

export default function ForgotPasswordPage() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao enviar.");
        return;
      }
      setDone(true);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

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
          {t("auth.forgotTitle")}
        </h1>
        <p className="lede" style={{ marginBottom: 24 }}>
          {t("auth.forgotSubtitle")}
        </p>

        {done ? (
          <div className="verify-banner">
            <p>{t("auth.forgotSent")}</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="auth">
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
            <button type="submit" className="auth-btn btn-orange" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" /> …
                </>
              ) : (
                t("auth.forgotSubmit")
              )}
            </button>
          </form>
        )}

        <p className="signin" style={{ marginTop: 20 }}>
          <Link href="/login">← {t("auth.backToLogin")}</Link>
        </p>
      </div>
    </div>
  );
}
