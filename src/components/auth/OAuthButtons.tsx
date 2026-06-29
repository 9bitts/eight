"use client";

import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

type Providers = { twitter: boolean; google: boolean; apple: boolean };

export function OAuthButtons({
  callbackUrl = "/feed",
  mode = "signup",
}: {
  callbackUrl?: string;
  mode?: "signup" | "login";
}) {
  const { t } = useLocale();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState<Providers>({
    twitter: false,
    google: false,
    apple: false,
  });

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then(setProviders)
      .catch(() => {});
  }, []);

  const onOAuth = async (provider: "twitter" | "google" | "apple") => {
    setError("");
    setLoading(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setError("Não foi possível conectar. Tente com e-mail.");
      setLoading(null);
    }
  };

  const labels = {
    twitter: mode === "signup" ? t("auth.signupX") : t("auth.withX"),
    google: mode === "signup" ? t("auth.signupGoogle") : t("auth.withGoogle"),
    apple: mode === "signup" ? t("auth.signupApple") : t("auth.withApple"),
  };

  const any = providers.twitter || providers.google || providers.apple;
  if (!any) return null;

  return (
    <div className="auth-oauth">
      {error && <p className="signup-error" style={{ marginBottom: 8 }}>{error}</p>}
      {providers.google && (
        <button
          type="button"
          className="auth-btn btn-white"
          onClick={() => onOAuth("google")}
          disabled={!!loading}
          style={{ opacity: loading ? 0.7 : 1, marginBottom: 8 }}
        >
          {loading === "google" ? <Loader2 size={18} className="spin" /> : <GoogleIcon />}
          {loading === "google" ? "Conectando…" : labels.google}
        </button>
      )}
      {providers.apple && (
        <button
          type="button"
          className="auth-btn btn-white"
          onClick={() => onOAuth("apple")}
          disabled={!!loading}
          style={{ opacity: loading ? 0.7 : 1, marginBottom: 8 }}
        >
          {loading === "apple" ? <Loader2 size={18} className="spin" /> : <AppleIcon />}
          {loading === "apple" ? "Conectando…" : labels.apple}
        </button>
      )}
      {providers.twitter && (
        <button
          type="button"
          className="auth-btn btn-white"
          onClick={() => onOAuth("twitter")}
          disabled={!!loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading === "twitter" ? <Loader2 size={18} className="spin" /> : <XIcon />}
          {loading === "twitter" ? "Conectando…" : labels.twitter}
        </button>
      )}
    </div>
  );
}
