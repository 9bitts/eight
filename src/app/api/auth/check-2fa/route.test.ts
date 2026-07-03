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

function check2faRequest(body: Record<string, string> = {}) {
  return new Request("http://localhost/api/auth/check-2fa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/check-2fa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
  });

  it("retorna 429 quando rate limit estoura", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 30 });

    const res = await POST(
      check2faRequest({ email: "ana@demo.eight", password: "senha-segura" })
    );
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.error).toContain("Aguarde 30s");
    expect(res.headers.get("Retry-After")).toBe("30");
  });

  it("sempre retorna needs2fa false enquanto 2FA estiver desativado", async () => {
    const res = await POST(
      check2faRequest({ email: "ana@demo.eight", password: "senha-segura" })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ needs2fa: false });
  });
});
