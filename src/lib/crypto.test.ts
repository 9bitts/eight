import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decrypt, encrypt } from "@/lib/crypto";

const TEST_KEY_A = Buffer.alloc(32, 7).toString("base64");
const TEST_KEY_B = Buffer.alloc(32, 9).toString("base64");

describe("crypto", () => {
  beforeEach(() => {
    process.env.TOTP_ENCRYPTION_KEY = TEST_KEY_A;
  });

  afterEach(() => {
    delete process.env.TOTP_ENCRYPTION_KEY;
  });

  it("encrypt seguido de decrypt retorna o texto original", () => {
    const plain = "JBSWY3DPEHPK3PXP";
    const encrypted = encrypt(plain);
    expect(encrypted.startsWith("v1:")).toBe(true);
    expect(decrypt(encrypted)).toBe(plain);
  });

  it("decrypt de valor legado sem v1: retorna o valor como veio", () => {
    const legacy = "JBSWY3DPEHPK3PXP";
    expect(decrypt(legacy)).toBe(legacy);
  });

  it("falha ao decriptar com chave diferente da usada na criptografia", () => {
    const encrypted = encrypt("segredo-totp-teste");
    process.env.TOTP_ENCRYPTION_KEY = TEST_KEY_B;
    expect(() => decrypt(encrypted)).toThrow();
  });
});
