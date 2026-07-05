import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  isAdminAppPath,
  shouldDenyAdminPathToNonAdmin,
} from "@/lib/admin-access";
import { isAdminUser, requireAdmin, requireAdminPage } from "@/lib/admin";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

const redirect = vi.fn((url: string): never => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirect(url),
}));

describe("admin-access (middleware)", () => {
  it("identifica paths /admin", () => {
    expect(isAdminAppPath("/admin")).toBe(true);
    expect(isAdminAppPath("/admin/casos")).toBe(true);
    expect(isAdminAppPath("/administration")).toBe(false);
    expect(isAdminAppPath("/feed")).toBe(false);
  });

  it("nega /admin a usuário logado sem claim isAdmin no JWT", () => {
    expect(
      shouldDenyAdminPathToNonAdmin("/admin/denuncias", {
        isLoggedIn: true,
        jwtIsAdmin: false,
      })
    ).toBe(true);
    expect(
      shouldDenyAdminPathToNonAdmin("/admin/denuncias", {
        isLoggedIn: true,
        jwtIsAdmin: undefined,
      })
    ).toBe(true);
  });

  it("permite /admin quando JWT tem isAdmin", () => {
    expect(
      shouldDenyAdminPathToNonAdmin("/admin/casos", {
        isLoggedIn: true,
        jwtIsAdmin: true,
      })
    ).toBe(false);
  });

  it("não aplica guard em rotas não-admin", () => {
    expect(
      shouldDenyAdminPathToNonAdmin("/feed", {
        isLoggedIn: true,
        jwtIsAdmin: false,
      })
    ).toBe(false);
  });
});

describe("isAdminUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ADMIN_EMAILS;
  });

  it("retorna true quando User.isAdmin no banco", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      isAdmin: true,
      email: "admin@test.com",
    } as never);

    await expect(isAdminUser("user-1")).resolves.toBe(true);
  });

  it("retorna true quando e-mail está em ADMIN_EMAILS", async () => {
    process.env.ADMIN_EMAILS = "ops@doctor8.com.br";
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      isAdmin: false,
      email: "ops@doctor8.com.br",
    } as never);

    await expect(isAdminUser("user-1")).resolves.toBe(true);
  });

  it("retorna false quando não é admin no banco nem na lista", async () => {
    process.env.ADMIN_EMAILS = "other@test.com";
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      isAdmin: false,
      email: "user@test.com",
    } as never);

    await expect(isAdminUser("user-1", "user@test.com")).resolves.toBe(false);
  });
});

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ADMIN_EMAILS;
  });

  it("bloqueia quando JWT tem isAdmin mas banco/lista negam (claim desatualizado)", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", email: "former@test.com", isAdmin: true },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      isAdmin: false,
      email: "former@test.com",
    } as never);

    await expect(requireAdmin()).rejects.toThrow("Acesso restrito à equipe Doctor8");
  });

  it("permite admin legítimo via ADMIN_EMAILS", async () => {
    process.env.ADMIN_EMAILS = "ops@test.com";
    vi.mocked(auth).mockResolvedValue({
      user: { id: "admin-1", email: "ops@test.com", isAdmin: false },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      isAdmin: false,
      email: "ops@test.com",
    } as never);

    await expect(requireAdmin()).resolves.toBe("admin-1");
  });
});

describe("requireAdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ADMIN_EMAILS;
  });

  it("redireciona não-admin para /feed mesmo com isAdmin true no JWT", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", email: "user@test.com", isAdmin: true },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      isAdmin: false,
      email: "user@test.com",
    } as never);

    await expect(requireAdminPage()).rejects.toThrow("REDIRECT:/feed");
    expect(redirect).toHaveBeenCalledWith("/feed");
  });

  it("redireciona não autenticado para /login", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(requireAdminPage()).rejects.toThrow("REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("retorna userId para admin legítimo", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "admin-1", email: "admin@test.com", isAdmin: true },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      isAdmin: true,
      email: "admin@test.com",
    } as never);

    await expect(requireAdminPage()).resolves.toEqual({
      userId: "admin-1",
      email: "admin@test.com",
    });
  });
});
