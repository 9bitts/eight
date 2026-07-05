import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { acquireSseConnection, releaseSseConnection } from "@/lib/sse-connections";
import { getUnreadNotificationCount } from "@/lib/feed";
import { getUnreadMessageCount } from "@/lib/messages";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    conversationParticipant: { findUnique: vi.fn() },
    directMessage: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/sse-connections", () => ({
  acquireSseConnection: vi.fn(),
  releaseSseConnection: vi.fn(),
}));

vi.mock("@/lib/feed", () => ({
  getUnreadNotificationCount: vi.fn(async () => 0),
}));

vi.mock("@/lib/messages", () => ({
  getUnreadMessageCount: vi.fn(async () => 0),
}));

function parseSseChunk(text: string): Record<string, unknown> {
  const line = text.split("\n").find((l) => l.startsWith("data: "));
  if (!line) throw new Error("SSE chunk sem data");
  return JSON.parse(line.slice("data: ".length)) as Record<string, unknown>;
}

describe("GET /api/events/stream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { profileId: "profile-1" },
    } as never);
    vi.mocked(acquireSseConnection).mockReturnValue(true);
    vi.mocked(getUnreadNotificationCount).mockResolvedValue(0);
    vi.mocked(getUnreadMessageCount).mockResolvedValue(0);
    vi.mocked(prisma.directMessage.findFirst).mockResolvedValue(null);
  });

  it("retorna 404 quando autenticado mas não é participante da conversa", async () => {
    vi.mocked(prisma.conversationParticipant.findUnique).mockResolvedValue(null);

    const res = await GET(
      new Request("http://localhost/api/events/stream?conversation=conv-secret")
    );

    expect(res.status).toBe(404);
    expect(prisma.conversationParticipant.findUnique).toHaveBeenCalledWith({
      where: {
        conversationId_profileId: {
          conversationId: "conv-secret",
          profileId: "profile-1",
        },
      },
      select: { id: true },
    });
    expect(acquireSseConnection).not.toHaveBeenCalled();
    expect(releaseSseConnection).not.toHaveBeenCalled();
  });

  it("abre o stream quando o usuário é participante da conversa", async () => {
    vi.mocked(prisma.conversationParticipant.findUnique).mockResolvedValue({
      id: "part-1",
    } as never);

    const res = await GET(
      new Request("http://localhost/api/events/stream?conversation=conv-mine")
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(acquireSseConnection).toHaveBeenCalledWith("profile-1");

    const reader = res.body!.getReader();
    const { value } = await reader.read();
    const payload = parseSseChunk(new TextDecoder().decode(value));
    expect(payload.connected).toBe(true);

    await reader.cancel();
    expect(releaseSseConnection).toHaveBeenCalledWith("profile-1");
  });

  it("stream geral sem conversation não exige checagem de participação", async () => {
    const res = await GET(new Request("http://localhost/api/events/stream"));

    expect(res.status).toBe(200);
    expect(prisma.conversationParticipant.findUnique).not.toHaveBeenCalled();
    expect(acquireSseConnection).toHaveBeenCalledWith("profile-1");

    const reader = res.body!.getReader();
    await reader.cancel();
  });

  it("cancel() limpa o interval e libera o slot SSE", async () => {
    vi.mocked(prisma.conversationParticipant.findUnique).mockResolvedValue({
      id: "part-1",
    } as never);

    const clearSpy = vi.spyOn(global, "clearInterval");

    const res = await GET(
      new Request("http://localhost/api/events/stream?conversation=conv-mine")
    );
    const reader = res.body!.getReader();
    await reader.read();

    await reader.cancel();

    expect(clearSpy).toHaveBeenCalled();
    expect(releaseSseConnection).toHaveBeenCalledWith("profile-1");

    clearSpy.mockRestore();
  });
});
