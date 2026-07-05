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

const PDF_BYTES = new TextEncoder().encode("%PDF-1.4\n");
const EXE_BYTES = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);

function verificationUploadRequest(bytes: Uint8Array, name: string, type: string) {
  const file = new File([bytes], name, { type });
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

    const res = await POST(verificationUploadRequest(PDF_BYTES, "crm.pdf", "application/pdf"));
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.error).toContain("Aguarde 25s");
    expect(uploadPrivateVerificationFile).not.toHaveBeenCalled();
  });

  it("aceita PDF com assinatura válida", async () => {
    const res = await POST(verificationUploadRequest(PDF_BYTES, "crm.pdf", "application/pdf"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.key).toBe("verification/test.pdf");
    expect(uploadPrivateVerificationFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      "pdf",
      "application/pdf"
    );
  });

  it("rejeita executável disfarçado de PDF", async () => {
    const res = await POST(verificationUploadRequest(EXE_BYTES, "crm.pdf", "application/pdf"));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("PDF válidos");
    expect(uploadPrivateVerificationFile).not.toHaveBeenCalled();
  });
});
