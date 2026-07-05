import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { auth } from "@/auth";
import { uploadFile } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
  uploadFile: vi.fn(async () => "/uploads/test.jpg"),
}));

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    clientIp: vi.fn(() => "203.0.113.1"),
    rateLimit: vi.fn(),
  };
});

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const EXE_BYTES = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);

function uploadRequest(bytes: Uint8Array, name: string, type: string) {
  const file = new File([bytes], name, { type });
  const form = new FormData();
  form.append("file", file);
  return new Request("http://localhost/api/upload", { method: "POST", body: form });
}

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", profileId: "profile-1" },
    } as never);
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
  });

  it("aceita JPEG com assinatura válida", async () => {
    const res = await POST(uploadRequest(JPEG_BYTES, "photo.jpg", "image/jpeg"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toBe("/uploads/test.jpg");
    expect(uploadFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      "jpg",
      "image/jpeg"
    );
  });

  it("rejeita executável com MIME/extensão falsificados", async () => {
    const res = await POST(uploadRequest(EXE_BYTES, "photo.jpg", "image/jpeg"));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("inválido");
    expect(uploadFile).not.toHaveBeenCalled();
  });
});
