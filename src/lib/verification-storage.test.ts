import { describe, expect, it } from "vitest";
import {
  assertSafeVerificationStorageKey,
  buildVerificationStorageKey,
  resolveLocalVerificationFilePath,
} from "@/lib/verification-storage";

describe("buildVerificationStorageKey", () => {
  it("gera chave com prefixo do perfil dono", () => {
    const key = buildVerificationStorageKey("profile-abc", "pdf");
    expect(key).toMatch(/^verification\/profile-abc\/[0-9a-f-]{36}\.pdf$/);
  });

  it("rejeita perfil com caracteres inválidos", () => {
    expect(() => buildVerificationStorageKey("../evil", "pdf")).toThrow();
  });
});

describe("assertSafeVerificationStorageKey", () => {
  const validScoped =
    "verification/profile-1/550e8400-e29b-41d4-a716-446655440000.pdf";
  const validLegacy = "verification/550e8400-e29b-41d4-a716-446655440000.pdf";

  it("aceita chave válida escopada por perfil", () => {
    expect(assertSafeVerificationStorageKey(validScoped, "profile-1")).toBe(validScoped);
  });

  it("aceita chave legada sem segmento de perfil", () => {
    expect(assertSafeVerificationStorageKey(validLegacy, "profile-1")).toBe(validLegacy);
  });

  it("rejeita path traversal e caminhos absolutos", () => {
    for (const key of [
      "verification/profile-1/../../../etc/passwd",
      "verification/profile-1/550e8400-e29b-41d4-a716-446655440000.pdf/../../../etc/passwd",
      "/etc/passwd",
      "https://evil.example/doc.pdf",
      "verification/profile-1/not-a-uuid.pdf",
      "",
    ]) {
      expect(() => assertSafeVerificationStorageKey(key)).toThrow("Documento inválido.");
    }
  });

  it("rejeita chave de outro perfil quando expectedProfileId informado", () => {
    expect(() =>
      assertSafeVerificationStorageKey(validScoped, "profile-other")
    ).toThrow("Documento inválido.");
  });
});

describe("resolveLocalVerificationFilePath", () => {
  it("resolve caminho dentro do diretório base", () => {
    const key =
      "verification/profile-1/550e8400-e29b-41d4-a716-446655440000.pdf";
    const resolved = resolveLocalVerificationFilePath(key);
    expect(resolved).toContain("data");
    expect(resolved).toContain("verification");
    expect(resolved).toContain("profile-1");
    expect(resolved).not.toContain("..");
  });

  it("rejeita traversal na resolução final", () => {
    expect(() =>
      resolveLocalVerificationFilePath(
        "verification/profile-1/550e8400-e29b-41d4-a716-446655440000.pdf/../../../etc/passwd"
      )
    ).toThrow("Documento inválido.");
  });
});
