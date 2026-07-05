import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  assertAllowedPostMedia,
  assertAllowedProfileMedia,
  buildPublicUploadUrl,
  isAllowedMediaUrl,
} from "@/lib/media-url";

describe("isAllowedMediaUrl", () => {
  beforeEach(() => {
    delete process.env.S3_PUBLIC_URL;
    delete process.env.S3_BUCKET;
    delete process.env.S3_ENDPOINT;
    process.env.NEXT_PUBLIC_SITE_URL = "https://doctor8.com.br";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("aceita caminho relativo /uploads/", () => {
    expect(isAllowedMediaUrl("/uploads/abc.jpg")).toBe(true);
  });

  it("aceita URL do CDN configurado (S3_PUBLIC_URL)", () => {
    process.env.S3_PUBLIC_URL = "https://cdn.doctor8.com.br";
    expect(isAllowedMediaUrl("https://cdn.doctor8.com.br/uploads/abc.jpg")).toBe(true);
  });

  it("aceita URL do endpoint S3 quando bucket/path batem", () => {
    process.env.S3_ENDPOINT = "https://s3.example.com";
    process.env.S3_BUCKET = "eight-media";
    expect(
      isAllowedMediaUrl("https://s3.example.com/eight-media/uploads/abc.mp4")
    ).toBe(true);
  });

  it("rejeita URL no S3_ENDPOINT com bucket diferente de S3_BUCKET", () => {
    process.env.S3_ENDPOINT = "https://s3.example.com";
    process.env.S3_BUCKET = "eight-media";
    expect(
      isAllowedMediaUrl("https://s3.example.com/outro-cliente/uploads/abc.jpg")
    ).toBe(false);
  });

  it("rejeita domínio externo", () => {
    expect(isAllowedMediaUrl("https://evil.example/photo.jpg")).toBe(false);
  });

  it("rejeita path traversal", () => {
    expect(isAllowedMediaUrl("/uploads/../etc/passwd")).toBe(false);
  });

  it("permite null/vazio (campo opcional)", () => {
    expect(isAllowedMediaUrl(null)).toBe(true);
    expect(isAllowedMediaUrl("")).toBe(true);
  });

  it("rejeita subdomínio falso do CDN (hostname real via URL parser)", () => {
    process.env.S3_PUBLIC_URL = "https://cdn.doctor8.com.br";
    expect(
      isAllowedMediaUrl("https://cdn.doctor8.com.br.atacante.com/uploads/x.jpg")
    ).toBe(false);
  });

  it("rejeita path externo que só contém /uploads/ no pathname", () => {
    expect(isAllowedMediaUrl("https://evil.example/redirect/uploads/x.jpg")).toBe(false);
  });

  it("rejeita URL protocol-relative", () => {
    expect(isAllowedMediaUrl("//atacante.com/uploads/x.jpg")).toBe(false);
  });

  it("rejeita userinfo que desvia o host (user@host real)", () => {
    process.env.S3_PUBLIC_URL = "https://cdn.doctor8.com.br";
    expect(
      isAllowedMediaUrl("https://cdn.doctor8.com.br@atacante.com/uploads/x.jpg")
    ).toBe(false);
  });

  it("rejeita esquemas perigosos (javascript:, data:)", () => {
    expect(isAllowedMediaUrl("javascript:alert(1)")).toBe(false);
    expect(isAllowedMediaUrl("data:text/html,<svg/onload=alert(1)>")).toBe(false);
    expect(isAllowedMediaUrl("file:///etc/passwd")).toBe(false);
  });

  it("rejeita http: absoluto (somente https: ou caminho relativo /uploads/)", () => {
    process.env.S3_PUBLIC_URL = "https://cdn.doctor8.com.br";
    expect(isAllowedMediaUrl("http://cdn.doctor8.com.br/uploads/x.jpg")).toBe(false);
  });

  it("compara hostname case-insensitive via origin normalizado", () => {
    process.env.S3_PUBLIC_URL = "https://cdn.doctor8.com.br";
    expect(isAllowedMediaUrl("https://CDN.DOCTOR8.COM.BR/uploads/x.jpg")).toBe(true);
  });

  it("caminho relativo exige prefixo /uploads/ (não substring)", () => {
    expect(isAllowedMediaUrl("/evil/uploads/x.jpg")).toBe(false);
    expect(isAllowedMediaUrl("/uploads/x.jpg")).toBe(true);
  });

  it("rejeita userinfo mesmo em host confiável", () => {
    process.env.S3_PUBLIC_URL = "https://cdn.doctor8.com.br";
    expect(isAllowedMediaUrl("https://user@cdn.doctor8.com.br/uploads/x.jpg")).toBe(false);
  });
});

describe("assertAllowedPostMedia", () => {
  it("aceita mídia do storage da plataforma", () => {
    expect(() =>
      assertAllowedPostMedia({
        images: ["/uploads/a.jpg"],
        videoUrl: "/uploads/b.mp4",
        gifUrl: "/uploads/c.gif",
      })
    ).not.toThrow();
  });

  it("rejeita URL externa em images", () => {
    expect(() =>
      assertAllowedPostMedia({ images: ["https://evil.example/x.jpg"] })
    ).toThrow("Use apenas imagens enviadas pela plataforma.");
  });
});

describe("assertAllowedProfileMedia", () => {
  it("rejeita avatar externo", () => {
    expect(() =>
      assertAllowedProfileMedia({ avatarUrl: "https://evil.example/a.jpg" })
    ).toThrow("Use apenas imagens enviadas pela plataforma.");
  });

  it("aceita avatar do storage local", () => {
    expect(() =>
      assertAllowedProfileMedia({ avatarUrl: "/uploads/avatar.webp" })
    ).not.toThrow();
  });
});

describe("fluxo legítimo upload → post/perfil", () => {
  it("URL retornada por buildPublicUploadUrl é aceita em post e perfil", () => {
    process.env.S3_PUBLIC_URL = "https://cdn.doctor8.com.br";
    const url = buildPublicUploadUrl("foto.jpg");

    expect(url).toBe("https://cdn.doctor8.com.br/uploads/foto.jpg");
    expect(isAllowedMediaUrl(url)).toBe(true);
    expect(() => assertAllowedPostMedia({ images: [url] })).not.toThrow();
    expect(() => assertAllowedProfileMedia({ avatarUrl: url })).not.toThrow();
  });
});
