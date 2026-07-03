import { describe, expect, it } from "vitest";
import { sanitizeCallbackUrl } from "./auth-redirect";

const ORIGIN = "https://doctor8.com.br";

describe("sanitizeCallbackUrl", () => {
  it("usa /feed quando vazio", () => {
    expect(sanitizeCallbackUrl(null)).toBe("/feed");
    expect(sanitizeCallbackUrl("")).toBe("/feed");
  });

  it("bloqueia /login e /signup", () => {
    expect(sanitizeCallbackUrl("/login")).toBe("/feed");
    expect(sanitizeCallbackUrl("/signup")).toBe("/feed");
    expect(sanitizeCallbackUrl("/login/esqueci-senha")).toBe("/feed");
  });

  it("desaninha callbackUrl recursivo na URL de login", () => {
    const nested =
      "https://doctor8.com.br/login?callbackUrl=https%3A%2F%2Fdoctor8.com.br%2Flogin";
    expect(sanitizeCallbackUrl(nested, ORIGIN)).toBe("/feed");
  });

  it("preserva destinos válidos", () => {
    expect(sanitizeCallbackUrl("/explore")).toBe("/explore");
    expect(sanitizeCallbackUrl("/messages/abc")).toBe("/messages/abc");
  });

  it("rejeita origem externa", () => {
    expect(sanitizeCallbackUrl("https://evil.com/feed", ORIGIN)).toBe("/feed");
  });
});
