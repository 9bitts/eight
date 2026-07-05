import { describe, expect, it } from "vitest";
import {
  detectFileSignature,
  PUBLIC_UPLOAD_MIMES,
  validateFileSignature,
  VERIFICATION_UPLOAD_MIMES,
} from "@/lib/file-signature";

const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
]);
const PDF_BYTES = Buffer.from("%PDF-1.4\n");
const EXE_BYTES = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);

describe("detectFileSignature", () => {
  it("detecta JPEG pelos magic bytes", () => {
    expect(detectFileSignature(JPEG_BYTES)?.mime).toBe("image/jpeg");
  });

  it("detecta PNG pelos magic bytes", () => {
    expect(detectFileSignature(PNG_BYTES)?.mime).toBe("image/png");
  });

  it("detecta PDF pelos magic bytes", () => {
    expect(detectFileSignature(PDF_BYTES)?.mime).toBe("application/pdf");
  });

  it("rejeita executável disfarçado", () => {
    expect(detectFileSignature(EXE_BYTES)).toBeNull();
  });
});

describe("validateFileSignature", () => {
  it("aceita JPEG no endpoint público", () => {
    expect(validateFileSignature(JPEG_BYTES, PUBLIC_UPLOAD_MIMES)?.mime).toBe("image/jpeg");
  });

  it("rejeita PDF no endpoint público", () => {
    expect(validateFileSignature(PDF_BYTES, PUBLIC_UPLOAD_MIMES)).toBeNull();
  });

  it("aceita PDF no endpoint de verificação", () => {
    expect(validateFileSignature(PDF_BYTES, VERIFICATION_UPLOAD_MIMES)?.mime).toBe(
      "application/pdf"
    );
  });

  it("rejeita executável com MIME falsificado (via conteúdo)", () => {
    expect(validateFileSignature(EXE_BYTES, PUBLIC_UPLOAD_MIMES)).toBeNull();
    expect(validateFileSignature(EXE_BYTES, VERIFICATION_UPLOAD_MIMES)).toBeNull();
  });
});
