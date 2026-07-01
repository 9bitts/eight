import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendDirectMessage } from "@/lib/actions/messages";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    rateLimit: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    conversationParticipant: { findUnique: vi.fn() },
    directMessage: { create: vi.fn() },
    conversation: { update: vi.fn() },
    profile: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/messages", () => ({
  assertCanMessage: vi.fn(),
}));

vi.mock("@/lib/notifications-server", () => ({
  createNotificationIfAllowed: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("sendDirectMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { profileId: "profile-1" },
    } as never);
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
  });

  it("bloqueia envio quando rate limit estoura", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 30 });

    await expect(sendDirectMessage("conv-1", "Olá")).rejects.toThrow("Aguarde 30s.");
    expect(prisma.conversationParticipant.findUnique).not.toHaveBeenCalled();
    expect(prisma.directMessage.create).not.toHaveBeenCalled();
  });
});
