import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { auth } from "@/auth";
import { uploadPrivateVerificationFile } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
  uploadPrivateVerificationFile: vi.fn(async () => "verification/test.pdf"),
}));

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    clientIp: vi.fn(() => "203.0.113.1"),
    rateLimit: vi.fn(),
  };
});

function verificationUploadRequest() {
  const file = new File(["pdf-content"], "crm.pdf", { type: "application/pdf" });
  const form = new FormData();
  form.append("file", file);
  return new Request("http://localhost/api/upload/verification", {
    method: "POST",
    body: form,
  });
}

describe("POST /api/upload/verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", profileId: "profile-1" },
    } as never);
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
  });

  it("retorna 429 quando rate limit estoura", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 25 });

    const res = await POST(verificationUploadRequest());
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.error).toContain("Aguarde 25s");
    expect(uploadPrivateVerificationFile).not.toHaveBeenCalled();
  });
});
