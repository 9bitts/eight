"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import { Doctor8LoginButton } from "@/components/auth/Doctor8LoginButton";
import { EmailLoginForm } from "@/components/auth/EmailLoginForm";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { sanitizeCallbackUrl } from "@/lib/auth-redirect";
import { getAuthErrorMessage } from "@/lib/auth-errors";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));
  const invite = searchParams.get("invite");
  const authError = getAuthErrorMessage(searchParams.get("error"));
  const resetOk = searchParams.get("reset") === "ok";

  useEffect(() => {
    const raw = searchParams.get("callbackUrl");
    if (!raw) return;
    const safe = sanitizeCallbackUrl(raw);
    if (raw === safe) return;
    const params = new URLSearchParams();
    if (safe !== "/feed") params.set("callbackUrl", safe);
    const inv = searchParams.get("invite");
    if (inv) params.set("invite", inv);
    const reset = searchParams.get("reset");
    if (reset) params.set("reset", reset);
    const qs = params.toString();
    router.replace(qs ? `/login?${qs}` : "/login");
  }, [searchParams, router]);

  return (
    <>
      {authError && (
        <p className="signup-error" style={{ marginBottom: 16 }}>
          {authError}
        </p>
      )}

      <EmailLoginForm callbackUrl={callbackUrl} resetOk={resetOk} />

      <p
        className="signup-sub"
        style={{ textAlign: "center", margin: "20px 0 16px", color: "var(--eight-muted)" }}
      >
        ou com Doctor8
      </p>

      <Doctor8LoginButton callbackUrl={callbackUrl} invite={invite} />
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

        <p className="signin" style={{ marginTop: 20 }}>
          {t("auth.noAccount")} <Link href="/signup">{t("auth.signup")}</Link>
        </p>
        <p className="signin" style={{ marginTop: 12 }}>
          <Link href="/">← Voltar ao início</Link>
        </p>
      </div>
    </div>
  );
}
