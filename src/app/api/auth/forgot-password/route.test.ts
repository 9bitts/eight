import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { requestPasswordReset } from "@/lib/password-reset";
import { rateLimit } from "@/lib/rate-limit";

vi.mock("@/lib/password-reset", () => ({
  requestPasswordReset: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    clientIp: vi.fn(() => "203.0.113.1"),
    rateLimit: vi.fn(),
  };
});

function forgotRequest(email = "ana@demo.eight") {
  return new Request("http://localhost/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
  });

  it("retorna 429 quando rate limit estoura", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 60 });

    const res = await POST(forgotRequest());
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.error).toContain("Aguarde 60s");
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });
});
