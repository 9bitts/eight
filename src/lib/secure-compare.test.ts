import { describe, expect, it } from "vitest";
import { secureCompare } from "@/lib/secure-compare";

describe("secureCompare", () => {
  it("retorna true para strings iguais", () => {
    expect(secureCompare("secret-token", "secret-token")).toBe(true);
  });

  it("retorna false para strings diferentes ou tamanhos diferentes", () => {
    expect(secureCompare("secret-token", "wrong-token")).toBe(false);
    expect(secureCompare("short", "much-longer")).toBe(false);
  });
});
