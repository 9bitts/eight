"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [csrfToken, setCsrfToken] = useState("");

  const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((data: { doctor8?: boolean }) => setConfigured(!!data.doctor8))
      .catch(() => setConfigured(false));

    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((data: { csrfToken?: string }) => setCsrfToken(data.csrfToken ?? ""))
      .catch(() => setCsrfToken(""));
  }, []);

  const onSubmit = () => {
    if (loading || configured === false || !csrfToken) return;
    setError("");
    setLoading(true);

    if (invite) {
      document.cookie = `eight_invite=${encodeURIComponent(invite)}; path=/; max-age=3600; SameSite=Lax`;
    }
  };

  return (
    <div className="auth" style={fullWidth ? undefined : { width: "auto" }}>
      {error && (
        <p className="signup-error" style={{ marginBottom: 8 }}>
          {error}
        </p>
      )}
      <form
        method="post"
        action="/api/auth/signin/doctor8"
        onSubmit={onSubmit}
        style={{ margin: 0 }}
      >
        <input type="hidden" name="callbackUrl" value={safeCallbackUrl} />
        <input type="hidden" name="csrfToken" value={csrfToken} />
        <button
          type="submit"
          className={className}
          disabled={loading || configured === false || !csrfToken}
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
      </form>
    </div>
  );
}
