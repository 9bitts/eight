import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSignedDownloadUrl } from "@/lib/storage";

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

const KEY_A =
  "verification/profile-a/550e8400-e29b-41d4-a716-446655440000.pdf";
const KEY_B =
  "verification/profile-b/660e8400-e29b-41d4-a716-446655440001.pdf";
const LEGACY_KEY = "verification/770e8400-e29b-41d4-a716-446655440002.pdf";

describe("getSignedDownloadUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.S3_BUCKET = "eight-private";
    process.env.S3_ACCESS_KEY_ID = "test-access-key";
    process.env.S3_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.S3_ENDPOINT = "https://s3.example.com";

    vi.mocked(getSignedUrl).mockImplementation(async (_client, command, options) => {
      const key = (command as GetObjectCommand).input.Key ?? "unknown";
      return `https://signed.example/${key}?expiresIn=${options?.expiresIn}`;
    });
  });

  afterEach(() => {
    delete process.env.S3_BUCKET;
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;
    delete process.env.S3_ENDPOINT;
  });

  it("passa expiração padrão de 900 segundos ao presigner", async () => {
    await getSignedDownloadUrl(KEY_A, undefined, "profile-a");

    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: "eight-private",
          Key: KEY_A,
        }),
      }),
      { expiresIn: 900 }
    );
  });

  it("gera URLs distintas para documentos de usuários diferentes", async () => {
    const urlA = await getSignedDownloadUrl(KEY_A, undefined, "profile-a");
    const urlB = await getSignedDownloadUrl(KEY_B, undefined, "profile-b");

    expect(urlA).toContain(KEY_A);
    expect(urlB).toContain(KEY_B);
    expect(urlA).not.toBe(urlB);

    const calls = vi.mocked(getSignedUrl).mock.calls;
    const keyA = (calls[0][1] as GetObjectCommand).input.Key;
    const keyB = (calls[1][1] as GetObjectCommand).input.Key;
    expect(keyA).toBe(KEY_A);
    expect(keyB).toBe(KEY_B);
  });

  it("extrai chave de URL legada antes de assinar", async () => {
    await getSignedDownloadUrl(
      "https://s3.example.com/eight-private/verification/770e8400-e29b-41d4-a716-446655440002.pdf"
    );

    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        input: expect.objectContaining({ Key: LEGACY_KEY }),
      }),
      expect.objectContaining({ expiresIn: 900 })
    );
  });

  it("rejeita chave de verificação de outro perfil", async () => {
    await expect(getSignedDownloadUrl(KEY_A, undefined, "profile-other")).rejects.toThrow(
      "Documento inválido."
    );
  });
});
