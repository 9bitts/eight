import { describe, expect, it } from "vitest";
import { handleError, isValidEmail, passwordError } from "@/lib/validators";

describe("passwordError", () => {
  it("aceita senha com 8 ou mais caracteres", () => {
    expect(passwordError("12345678")).toBeNull();
    expect(passwordError("senha-forte-123")).toBeNull();
  });

  it("rejeita senha curta", () => {
    expect(passwordError("1234567")).toBe(
      "A senha precisa ter pelo menos 8 caracteres."
    );
    expect(passwordError("")).toBe("A senha precisa ter pelo menos 8 caracteres.");
  });
});

describe("handleError", () => {
  it("aceita handle valido", () => {
    expect(handleError("ana")).toBeNull();
    expect(handleError("dr_silva")).toBeNull();
    expect(handleError("a1b2c3d4e5f6g7")).toBeNull();
  });

  it("rejeita handle vazio", () => {
    expect(handleError("")).toBe("Escolha um nome de usuário.");
  });

  it("rejeita handle curto ou longo", () => {
    expect(handleError("ab")).toBe("Mínimo de 3 caracteres.");
    expect(handleError("a".repeat(16))).toBe("Máximo de 15 caracteres.");
  });

  it("rejeita caracteres ou formato invalidos", () => {
    expect(handleError("1abc")).toBe(
      "Use apenas letras minúsculas, números e _. Deve começar com letra."
    );
    expect(handleError("ana-silva")).toBe(
      "Use apenas letras minúsculas, números e _. Deve começar com letra."
    );
  });
});

describe("isValidEmail", () => {
  it("aceita e-mails validos", () => {
    expect(isValidEmail("ana@demo.eight")).toBe(true);
    expect(isValidEmail("  miguel@example.com  ")).toBe(true);
  });

  it("rejeita e-mails invalidos", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("sem-arroba")).toBe(false);
    expect(isValidEmail("@dominio.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
  });
});
