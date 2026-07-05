import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { isCloudStorageEnabled, readLocalVerificationFile } from "@/lib/storage";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/admin", () => ({
  isAdminUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/storage", () => ({
  isCloudStorageEnabled: vi.fn(() => false),
  readLocalVerificationFile: vi.fn(async () => Buffer.from("pdf-bytes")),
  getSignedDownloadUrl: vi.fn(),
}));

const VALID_KEY =
  "verification/profile-owner/550e8400-e29b-41d4-a716-446655440000.pdf";

function documentRequest(profileId?: string) {
  const url = profileId
    ? `http://localhost/api/verification/document?profileId=${encodeURIComponent(profileId)}`
    : "http://localhost/api/verification/document";
  return new Request(url);
}

describe("GET /api/verification/document", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-owner", profileId: "profile-owner", email: "owner@test.com" },
    } as never);
    vi.mocked(isAdminUser).mockResolvedValue(false);
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      verificationDocumentUrl: VALID_KEY,
    } as never);
  });

  it("permite dono ler documento legítimo", async () => {
    const res = await GET(documentRequest("profile-owner"));

    expect(res.status).toBe(200);
    expect(readLocalVerificationFile).toHaveBeenCalledWith(VALID_KEY, "profile-owner");
  });

  it("permite admin ler documento de outro perfil", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "admin-1", profileId: "profile-admin", email: "admin@test.com" },
    } as never);
    vi.mocked(isAdminUser).mockResolvedValue(true);

    const res = await GET(documentRequest("profile-owner"));

    expect(res.status).toBe(200);
    expect(readLocalVerificationFile).toHaveBeenCalledWith(VALID_KEY, "profile-owner");
  });

  it("retorna 404 genérico para usuário que não é dono nem admin", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-other", profileId: "profile-other", email: "other@test.com" },
    } as never);

    const res = await GET(documentRequest("profile-owner"));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Não encontrado");
    expect(readLocalVerificationFile).not.toHaveBeenCalled();
  });

  it("retorna 404 quando chave no banco contém path traversal", async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      verificationDocumentUrl: "verification/profile-owner/../../../etc/passwd",
    } as never);

    const res = await GET(documentRequest("profile-owner"));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Não encontrado");
    expect(readLocalVerificationFile).not.toHaveBeenCalled();
  });

  it("retorna 404 quando chave pertence a outro perfil", async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      verificationDocumentUrl:
        "verification/profile-other/550e8400-e29b-41d4-a716-446655440000.pdf",
    } as never);

    const res = await GET(documentRequest("profile-owner"));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Não encontrado");
    expect(readLocalVerificationFile).not.toHaveBeenCalled();
  });
});
