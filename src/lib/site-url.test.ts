import { afterEach, describe, expect, it } from "vitest";
import { resolveSiteUrl } from "@/lib/site-url";

describe("resolveSiteUrl", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("prioriza NEXT_PUBLIC_SITE_URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://app.example.com/";
    process.env.AUTH_URL = "http://localhost:3001";
    expect(resolveSiteUrl()).toBe("https://app.example.com");
  });

  it("usa fallback de produção sem localhost", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.AUTH_URL;
    process.env.NODE_ENV = "production";
    expect(resolveSiteUrl()).toBe("https://doctor8.com.br");
  });
});
