"use client";

import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { sanitizeCallbackUrl } from "@/lib/auth-redirect";

function Doctor8Icon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" opacity="0.15" />
      <path
        d="M12 7v10M8 11h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Doctor8LoginButton({
  callbackUrl = "/feed",
  invite,
  className = "auth-btn btn-orange",
  fullWidth = true,
}: {
  callbackUrl?: string;
  invite?: string | null;
  className?: string;
  fullWidth?: boolean;
}) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onLogin = async () => {
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      if (invite) {
        document.cookie = `eight_invite=${encodeURIComponent(invite)}; path=/; max-age=3600; SameSite=Lax`;
      }

      await signIn("doctor8", {
        callbackUrl: sanitizeCallbackUrl(callbackUrl),
      });
    } catch {
      setError(t("auth.doctor8Error"));
      setLoading(false);
    }
  };

  return (
    <div className="auth" style={fullWidth ? undefined : { width: "auto" }}>
      {error && (
        <p className="signup-error" style={{ marginBottom: 8 }}>
          {error}
        </p>
      )}
      <button
        type="button"
        className={className}
        onClick={onLogin}
        disabled={loading}
        style={{ opacity: loading ? 0.85 : 1, width: fullWidth ? "100%" : undefined }}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="spin" /> …
          </>
        ) : (
          <>
            <Doctor8Icon />
            {t("auth.loginWithDoctor8")}
          </>
        )}
      </button>
    </div>
  );
}
