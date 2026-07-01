import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSignedDownloadUrl } from "@/lib/storage";

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

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
    await getSignedDownloadUrl("verification/doc.pdf");

    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: "eight-private",
          Key: "verification/doc.pdf",
        }),
      }),
      { expiresIn: 900 }
    );
  });

  it("gera URLs distintas para documentos de usuários diferentes", async () => {
    const urlA = await getSignedDownloadUrl("verification/user-a.pdf");
    const urlB = await getSignedDownloadUrl("verification/user-b.pdf");

    expect(urlA).toContain("verification/user-a.pdf");
    expect(urlB).toContain("verification/user-b.pdf");
    expect(urlA).not.toBe(urlB);

    const calls = vi.mocked(getSignedUrl).mock.calls;
    const keyA = (calls[0][1] as GetObjectCommand).input.Key;
    const keyB = (calls[1][1] as GetObjectCommand).input.Key;
    expect(keyA).toBe("verification/user-a.pdf");
    expect(keyB).toBe("verification/user-b.pdf");
  });

  it("extrai chave de URL legada antes de assinar", async () => {
    await getSignedDownloadUrl(
      "https://s3.example.com/eight-private/verification/legacy.pdf"
    );

    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        input: expect.objectContaining({ Key: "verification/legacy.pdf" }),
      }),
      expect.objectContaining({ expiresIn: 900 })
    );
  });
});
