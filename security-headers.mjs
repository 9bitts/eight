/**
 * Cabeçalhos HTTP de segurança globais (Etapas 1–3).
 * Importado por next.config.mjs e testado em src/lib/security-headers.test.ts.
 */

/** Etapa 1 — baixo risco */
export const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), interest-cohort=()",
  },
];

/** Etapa 2 — HSTS (sem preload) */
export const HSTS_HEADER = {
  key: "Strict-Transport-Security",
  value: "max-age=63072000; includeSubDomains",
};

/**
 * Etapa 3 — CSP Report-Only (não bloqueia; revisão antes de enforcement).
 *
 * Inventário refletido:
 * - Fontes: fonts.googleapis.com + fonts.gstatic.com (layout.tsx)
 * - Scripts/estilos: bundles Next.js ('self'); estilos inline React (style={{…}})
 * - Imagens/mídia: /uploads/, S3/CDN (env), previews de link (og:image arbitrário),
 *   avatares OAuth Doctor8 (profile.picture)
 * - connect-src: fetch/EventSource apenas same-origin
 * - OAuth Doctor8: redirect top-level (form POST → /api/auth/signin/doctor8); form-action 'self'
 * - SW: /sw.js (worker-src 'self')
 */
export function buildContentSecurityPolicyReportOnly(env = process.env) {
  const mediaOrigins = [];
  for (const raw of [env.S3_PUBLIC_URL, env.S3_ENDPOINT, env.NEXT_PUBLIC_SITE_URL]) {
    if (!raw?.trim()) continue;
    try {
      mediaOrigins.push(new URL(raw.trim().replace(/\/$/, "")).origin);
    } catch {
      /* ignorar env inválida */
    }
  }

  const doctor8Issuer =
    env.AUTH_DOCTOR8_ISSUER?.replace(/\/$/, "") ?? "https://app.doctor8.org";
  let doctor8Origin = "";
  try {
    doctor8Origin = new URL(doctor8Issuer).origin;
  } catch {
    doctor8Origin = "https://app.doctor8.org";
  }

  const imgSrc = ["'self'", "blob:", "data:", ...new Set(mediaOrigins), doctor8Origin, "https:"];
  const mediaSrc = ["'self'", ...new Set(mediaOrigins), "https:"];

  const scriptSrc =
    env.NODE_ENV === "production"
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

  const directives = [
    "default-src 'self'",
    // Next.js 14 App Router: scripts inline de hidratação; 'unsafe-eval' só em dev (next dev)
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    `img-src ${imgSrc.join(" ")}`,
    `media-src ${mediaSrc.join(" ")}`,
    "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  return directives.join("; ");
}

export function getGlobalSecurityHeaders(env = process.env) {
  return [
    ...SECURITY_HEADERS,
    HSTS_HEADER,
    {
      key: "Content-Security-Policy-Report-Only",
      value: buildContentSecurityPolicyReportOnly(env),
    },
  ];
}
