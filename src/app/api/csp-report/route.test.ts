import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { rateLimit } from "@/lib/rate-limit";

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    clientIp: vi.fn(() => "203.0.113.1"),
    rateLimit: vi.fn(),
  };
});

function cspReportRequest(body?: string, contentType = "application/csp-report") {
  return new Request("http://localhost/api/csp-report", {
    method: "POST",
    headers: contentType ? { "Content-Type": contentType } : {},
    body,
  });
}

describe("POST /api/csp-report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
  });

  it("aceita POST com relatório JSON e responde 204", async () => {
    const report = {
      "csp-report": {
        "document-uri": "https://example.com/feed",
        "violated-directive": "script-src 'self'",
        "blocked-uri": "https://evil.example/script.js",
      },
    };

    const res = await POST(cspReportRequest(JSON.stringify(report)));

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });

  it("responde 204 sem quebrar para corpo inválido ou malformado", async () => {
    for (const body of ["not-json", "{broken", "", "   "]) {
      const res = await POST(cspReportRequest(body));
      expect(res.status).toBe(204);
    }
  });

  it("retorna 429 quando rate limit estoura", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 15 });

    const res = await POST(
      cspReportRequest(JSON.stringify({ "csp-report": { "document-uri": "/" } }))
    );
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.error).toContain("Aguarde 15s");
  });
});
