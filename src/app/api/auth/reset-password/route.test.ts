import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { resetPasswordWithToken } from "@/lib/password-reset";
import { rateLimit } from "@/lib/rate-limit";

vi.mock("@/lib/password-reset", () => ({
  resetPasswordWithToken: vi.fn(),
}));

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    clientIp: vi.fn(() => "203.0.113.1"),
    rateLimit: vi.fn(),
  };
});

function resetRequest() {
  return new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "ana@demo.eight",
      token: "abc123",
      password: "nova-senha-123",
    }),
  });
}

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
  });

  it("retorna 429 quando rate limit estoura", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 90 });

    const res = await POST(resetRequest());
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.error).toContain("Aguarde 90s");
    expect(resetPasswordWithToken).not.toHaveBeenCalled();
  });
});
