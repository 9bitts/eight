import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  detectClinicalCaseViolations,
  isInClinicalCaseThread,
  validateClinicalCaseBody,
} from "@/lib/cases";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: { findUnique: vi.fn() },
  },
}));

describe("detectClinicalCaseViolations", () => {
  it("bloqueia CPF sem exigir tamanho mínimo", () => {
    expect(detectClinicalCaseViolations("CPF 123.456.789-00")).toContain("CPF");
  });

  it("permite resposta curta sem dado sensível", () => {
    expect(detectClinicalCaseViolations("Mesmo achado aqui")).toBeNull();
  });
});

describe("validateClinicalCaseBody", () => {
  it("exige mínimo de 30 caracteres na criação", () => {
    expect(validateClinicalCaseBody("Texto curto demais.")).toContain("30 caracteres");
  });

  it("delega conteúdo sensível ao detectClinicalCaseViolations", () => {
    const body =
      "Paciente masculino de 52 anos com dor torácica e documento 123.456.789-00 em avaliação.";
    expect(validateClinicalCaseBody(body)).toContain("CPF");
  });
});

describe("isInClinicalCaseThread", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna true para resposta direta ao caso", async () => {
    vi.mocked(prisma.post.findUnique).mockImplementation(async ({ where }) => {
      if (where.id === "reply-1") {
        return { isClinicalCase: false, parentId: "case-1" } as never;
      }
      if (where.id === "case-1") {
        return { isClinicalCase: true, parentId: null } as never;
      }
      return null;
    });

    await expect(isInClinicalCaseThread("reply-1")).resolves.toBe(true);
  });

  it("retorna true para resposta nível 2+ na mesma thread", async () => {
    vi.mocked(prisma.post.findUnique).mockImplementation(async ({ where }) => {
      if (where.id === "reply-2") {
        return { isClinicalCase: false, parentId: "reply-1" } as never;
      }
      if (where.id === "reply-1") {
        return { isClinicalCase: false, parentId: "case-1" } as never;
      }
      if (where.id === "case-1") {
        return { isClinicalCase: true, parentId: null } as never;
      }
      return null;
    });

    await expect(isInClinicalCaseThread("reply-2")).resolves.toBe(true);
  });

  it("retorna false fora de thread de caso", async () => {
    vi.mocked(prisma.post.findUnique).mockResolvedValue({
      isClinicalCase: false,
      parentId: null,
    } as never);

    await expect(isInClinicalCaseThread("normal-1")).resolves.toBe(false);
  });
});
