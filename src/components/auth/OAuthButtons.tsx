"use client";

import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function OAuthButtons({
  callbackUrl = "/feed",
  mode = "signup",
}: {
  callbackUrl?: string;
  mode?: "signup" | "login";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onX = async () => {
    setError("");
    setLoading(true);
    try {
      await signIn("twitter", { callbackUrl });
    } catch {
      setError("Não foi possível conectar com o X. Tente com e-mail.");
      setLoading(false);
    }
  };

  const label = mode === "signup" ? "Cadastrar com X" : "Entrar com X";

  return (
    <div className="auth-oauth">
      {error && <p className="signup-error" style={{ marginBottom: 8 }}>{error}</p>}
      <button
        type="button"
        className="auth-btn btn-white"
        onClick={onX}
        disabled={loading}
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? (
          <Loader2 size={18} className="spin" />
        ) : (
          <XIcon />
        )}
        {loading ? "Conectando…" : label}
      </button>
    </div>
  );
}
