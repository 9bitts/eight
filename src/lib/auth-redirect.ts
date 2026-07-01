const DEFAULT_CALLBACK = "/feed";

const AUTH_PREFIXES = ["/login", "/signup"];

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

  const pathname = path.split("?")[0];
  if (AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return DEFAULT_CALLBACK;
  }

  return path;
}

/** Navegação completa após login — garante que o cookie de sessão vá no próximo request. */
export function redirectAfterAuth(url: string) {
  const safe = sanitizeCallbackUrl(url);
  if (typeof window !== "undefined") {
    window.location.assign(safe);
  }
}
