const DEFAULT_CALLBACK = "/feed";

const AUTH_PREFIXES = ["/login", "/signup"];

function isAuthPath(pathname: string): boolean {
  return AUTH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/** Evita loops e redirecionamentos externos após login. */
export function sanitizeCallbackUrl(
  raw: string | null | undefined,
  origin?: string
): string {
  if (!raw?.trim()) return DEFAULT_CALLBACK;

  let path = raw.trim();

  try {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      const url = new URL(path);
      const base =
        origin ?? (typeof window !== "undefined" ? window.location.origin : "");
      if (!base || url.origin !== base) return DEFAULT_CALLBACK;
      path = url.pathname + url.search;
    }
  } catch {
    return DEFAULT_CALLBACK;
  }

  if (!path.startsWith("/")) path = `/${path}`;

  const parsed = new URL(path, "http://local");
  if (isAuthPath(parsed.pathname)) {
    const nested = parsed.searchParams.get("callbackUrl");
    if (nested) return sanitizeCallbackUrl(nested, origin);
    return DEFAULT_CALLBACK;
  }

  const nested = parsed.searchParams.get("callbackUrl");
  if (nested) {
    const safeNested = sanitizeCallbackUrl(nested, origin);
    if (safeNested !== nested) {
      if (safeNested === DEFAULT_CALLBACK) {
        parsed.searchParams.delete("callbackUrl");
      } else {
        parsed.searchParams.set("callbackUrl", safeNested);
      }
      const qs = parsed.searchParams.toString();
      return qs ? `${parsed.pathname}?${qs}` : parsed.pathname;
    }
  }

  return path;
}

/** Destino após login/cadastro — perfil incompleto vai para completar cadastro. */
export function resolvePostAuthRedirect(callbackUrl: string, hasProfile: boolean): string {
  if (!hasProfile) return "/signup/complete";
  return sanitizeCallbackUrl(callbackUrl);
}

/** Navegação completa após login — garante que o cookie de sessão vá no próximo request. */
export function redirectAfterAuth(url: string) {
  const safe = sanitizeCallbackUrl(url);
  if (typeof window !== "undefined") {
    window.location.assign(safe);
  }
}
