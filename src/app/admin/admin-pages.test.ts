import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

vi.mock("@/components/admin/AdminCasesClient", () => ({
  AdminCasesClient: () => null,
}));
vi.mock("@/components/admin/AdminReportsClient", () => ({
  AdminReportsClient: () => null,
}));
vi.mock("@/components/admin/AdminVerificationsClient", () => ({
  AdminVerificationsClient: () => null,
}));
vi.mock("@/components/admin/AdminInvitesClient", () => ({
  AdminInvitesClient: () => null,
}));

vi.mock("@/lib/actions/cases-admin", () => ({
  getClinicalCasesForAdmin: vi.fn(async () => [{ id: "case-1" }]),
}));
vi.mock("@/lib/actions/reports", () => ({
  getReportsForAdmin: vi.fn(async () => [{ id: "report-1" }]),
}));
vi.mock("@/lib/actions/admin", () => ({
  getPendingVerifications: vi.fn(async () => []),
  getRecentVerificationReviews: vi.fn(async () => []),
}));
vi.mock("@/lib/actions/invites", () => ({
  getAdminInvites: vi.fn(async () => [{ code: "abc" }]),
}));
vi.mock("@/lib/verification-document", () => ({
  resolveVerificationDocumentUrl: vi.fn(async () => null),
}));
vi.mock("@/lib/email", () => ({
  isEmailConfigured: vi.fn(() => true),
}));

import AdminCasesPage from "@/app/admin/casos/page";
import AdminReportsPage from "@/app/admin/denuncias/page";
import AdminVerificationsPage from "@/app/admin/verificacoes/page";
import AdminInvitesPage from "@/app/admin/convites/page";
import { getClinicalCasesForAdmin } from "@/lib/actions/cases-admin";
import { getReportsForAdmin } from "@/lib/actions/reports";
import { getPendingVerifications } from "@/lib/actions/admin";
import { getAdminInvites } from "@/lib/actions/invites";

const ADMIN_PAGES = [
  { name: "/admin/casos", Page: AdminCasesPage, dataFn: getClinicalCasesForAdmin },
  { name: "/admin/denuncias", Page: AdminReportsPage, dataFn: getReportsForAdmin },
  { name: "/admin/verificacoes", Page: AdminVerificationsPage, dataFn: getPendingVerifications },
  { name: "/admin/convites", Page: AdminInvitesPage, dataFn: getAdminInvites },
] as const;

function mockNonAdminSession() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", email: "user@test.com", isAdmin: false },
  } as never);
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    isAdmin: false,
    email: "user@test.com",
  } as never);
}

function mockStaleAdminJwtSession() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", email: "former@test.com", isAdmin: true },
  } as never);
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    isAdmin: false,
    email: "former@test.com",
  } as never);
}

function mockLegitimateAdminSession() {
  process.env.ADMIN_EMAILS = "ops@test.com";
  vi.mocked(auth).mockResolvedValue({
    user: { id: "admin-1", email: "ops@test.com", isAdmin: false },
  } as never);
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    isAdmin: false,
    email: "ops@test.com",
  } as never);
}

describe("páginas /admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ADMIN_EMAILS;
  });

  describe.each(ADMIN_PAGES)("$name", ({ Page, dataFn }) => {
    it("bloqueia usuário não-admin (redirect /feed)", async () => {
      mockNonAdminSession();

      await expect(Page()).rejects.toThrow("REDIRECT:/feed");
      expect(dataFn).not.toHaveBeenCalled();
    });

    it("bloqueia JWT com isAdmin desatualizado (checagem autoritativa)", async () => {
      mockStaleAdminJwtSession();

      await expect(Page()).rejects.toThrow("REDIRECT:/feed");
      expect(dataFn).not.toHaveBeenCalled();
    });

    it("permite admin legítimo e carrega dados (sem redirect)", async () => {
      mockLegitimateAdminSession();

      let redirected = false;
      try {
        await Page();
      } catch (e) {
        if (e instanceof Error && e.message.startsWith("REDIRECT:")) {
          redirected = true;
        } else if (!(e instanceof ReferenceError)) {
          throw e;
        }
      }

      expect(redirected).toBe(false);
      expect(dataFn).toHaveBeenCalled();
    });
  });
});
