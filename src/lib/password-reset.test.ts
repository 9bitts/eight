import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requestPasswordReset, resetPasswordWithToken } from "@/lib/password-reset";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    verificationToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  },
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async () => ({ sent: true })),
  isEmailConfigured: vi.fn(() => true),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async () => "new-hash"),
    compare: vi.fn(),
  },
}));

describe("requestPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gera token e persiste com expiracao de 1 hora", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      passwordHash: "hash",
    } as never);

    const before = Date.now();
    await requestPasswordReset("ana@demo.eight");
    const after = Date.now();

    expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: "reset:ana@demo.eight" },
    });

    const createCall = vi.mocked(prisma.verificationToken.create).mock.calls[0][0];
    expect(createCall.data.identifier).toBe("reset:ana@demo.eight");
    expect(createCall.data.token).toMatch(/^[a-f0-9]{64}$/);
    const expiresMs = createCall.data.expires.getTime();
    expect(expiresMs).toBeGreaterThanOrEqual(before + 60 * 60 * 1000 - 1000);
    expect(expiresMs).toBeLessThanOrEqual(after + 60 * 60 * 1000 + 1000);
  });

  it("nao cria token se usuario nao existe", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await requestPasswordReset("ausente@demo.eight");

    expect(prisma.verificationToken.create).not.toHaveBeenCalled();
  });
});

describe("resetPasswordWithToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita token invalido", async () => {
    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue(null);

    await expect(
      resetPasswordWithToken("ana@demo.eight", "token-invalido", "nova-senha-123")
    ).rejects.toThrow("Link expirado ou inválido. Solicite um novo.");
  });

  it("rejeita token expirado", async () => {
    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
      identifier: "reset:ana@demo.eight",
      token: "abc",
      expires: new Date(Date.now() - 1000),
    } as never);

    await expect(
      resetPasswordWithToken("ana@demo.eight", "abc", "nova-senha-123")
    ).rejects.toThrow("Link expirado ou inválido. Solicite um novo.");
  });

  it("rejeita senha fraca", async () => {
    await expect(
      resetPasswordWithToken("ana@demo.eight", "abc", "curta")
    ).rejects.toThrow("A senha precisa ter pelo menos 8 caracteres.");
  });

  it("conclui reset com token valido", async () => {
    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
      identifier: "reset:ana@demo.eight",
      token: "valid-token",
      expires: new Date(Date.now() + 60_000),
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      passwordHash: "old-hash",
    } as never);

    await resetPasswordWithToken("ana@demo.eight", "valid-token", "nova-senha-123");

    expect(bcrypt.hash).toHaveBeenCalledWith("nova-senha-123", 12);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: "ana@demo.eight" },
      data: { passwordHash: "new-hash" },
    });
    expect(prisma.verificationToken.delete).toHaveBeenCalledWith({
      where: {
        identifier_token: {
          identifier: "reset:ana@demo.eight",
          token: "valid-token",
        },
      },
    });
  });
});
