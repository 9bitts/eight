import { describe, expect, it } from "vitest";
import { detectPII } from "@/lib/pii-detector";

describe("detectPII", () => {
  it("bloqueia CPF com pontuacao", () => {
    const result = detectPII("Paciente com documento 123.456.789-00 em avaliacao.");
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain("CPF");
  });

  it("bloqueia CPF sem pontuacao", () => {
    const result = detectPII("Registro 12345678900 no prontuario.");
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain("CPF");
  });

  it("bloqueia telefone", () => {
    const result = detectPII("Ligar para (11) 98765-4321 apos alta.");
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain("telefones");
  });

  it("bloqueia e-mail", () => {
    const result = detectPII("Contato: paciente@email.com para retorno.");
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain("e-mails");
  });

  it("bloqueia nome de paciente", () => {
    const result = detectPII("Paciente João apresentou dor torácica.");
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain("nomes de pacientes");
  });

  it("permite texto clinico anonimizado", () => {
    const result = detectPII(
      "Adulto de 45 anos, sexo masculino, com dor torácica há 2 horas, sem comorbidades conhecidas."
    );
    expect(result.blocked).toBe(false);
    expect(result.reason).toBeUndefined();
  });

  it("ignora texto vazio", () => {
    expect(detectPII("")).toEqual({ blocked: false });
    expect(detectPII("   ")).toEqual({ blocked: false });
  });
});
