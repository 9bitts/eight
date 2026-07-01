import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendMessageRequest } from "@/lib/actions/message-requests";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { canOpenDirectConversation } from "@/lib/message-requests";

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
    messageRequest: { upsert: vi.fn() },
  },
}));

vi.mock("@/lib/messages", () => ({
  assertCanMessage: vi.fn(),
  findOrCreateConversation: vi.fn(),
}));

vi.mock("@/lib/message-requests", () => ({
  canOpenDirectConversation: vi.fn(),
}));

vi.mock("@/lib/notifications-server", () => ({
  createNotificationIfAllowed: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("sendMessageRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { profileId: "profile-1" },
    } as never);
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
    vi.mocked(canOpenDirectConversation).mockResolvedValue(false);
  });

  it("bloqueia envio quando rate limit estoura", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 45 });

    await expect(
      sendMessageRequest("profile-2", "Mensagem de apresentação válida aqui.")
    ).rejects.toThrow("Aguarde 45s.");
    expect(prisma.messageRequest.upsert).not.toHaveBeenCalled();
  });
});
