import { describe, expect, it } from "vitest";
import {
  SECURITY_HEADERS,
  HSTS_HEADER,
  buildContentSecurityPolicyReportOnly,
  getGlobalSecurityHeaders,
} from "../../security-headers.mjs";

describe("security headers globais", () => {
  it("inclui cabeçalhos da Etapa 1 e HSTS da Etapa 2", () => {
    const headers = getGlobalSecurityHeaders();
    const map = Object.fromEntries(headers.map((h) => [h.key, h.value]));

    expect(map["X-Content-Type-Options"]).toBe("nosniff");
    expect(map["X-Frame-Options"]).toBe("DENY");
    expect(map["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(map["Permissions-Policy"]).toContain("camera=()");
    expect(map["Permissions-Policy"]).toContain("microphone=()");
    expect(map["Permissions-Policy"]).toContain("geolocation=()");
    expect(map["Strict-Transport-Security"]).toBe(
      "max-age=63072000; includeSubDomains"
    );
    expect(map["Strict-Transport-Security"]).not.toContain("preload");
  });

  it("expõe CSP apenas em modo Report-Only", () => {
    const headers = getGlobalSecurityHeaders();
    const keys = headers.map((h) => h.key);
    expect(keys).toContain("Content-Security-Policy-Report-Only");
    expect(keys).not.toContain("Content-Security-Policy");
  });

  it("CSP inclui fontes Google e domínios de mídia configurados", () => {
    const csp = buildContentSecurityPolicyReportOnly({
      S3_PUBLIC_URL: "https://cdn.doctor8.com.br",
      S3_ENDPOINT: "https://s3.example.com",
      AUTH_DOCTOR8_ISSUER: "https://app.doctor8.org",
    });

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("https://fonts.googleapis.com");
    expect(csp).toContain("https://fonts.gstatic.com");
    expect(csp).toContain("https://cdn.doctor8.com.br");
    expect(csp).toContain("https://app.doctor8.org");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
  });

  it("CSP omite unsafe-eval em produção e inclui em dev", () => {
    const prod = buildContentSecurityPolicyReportOnly({ NODE_ENV: "production" });
    const dev = buildContentSecurityPolicyReportOnly({ NODE_ENV: "development" });

    expect(prod).toContain("script-src 'self' 'unsafe-inline'");
    expect(prod).not.toContain("unsafe-eval");
    expect(dev).toContain("'unsafe-eval'");
  });

  it("SECURITY_HEADERS e HSTS_HEADER mantêm valores estáveis", () => {
    expect(SECURITY_HEADERS).toHaveLength(4);
    expect(HSTS_HEADER.key).toBe("Strict-Transport-Security");
  });
});
