import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { auth } from "@/auth";
import { searchPosts, searchProfiles } from "@/lib/feed";
import { rateLimit } from "@/lib/rate-limit";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/feed", () => ({
  searchProfiles: vi.fn(async () => []),
  searchPosts: vi.fn(async () => []),
}));

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    clientIp: vi.fn(() => "203.0.113.1"),
    rateLimit: vi.fn(),
  };
});

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", profileId: "profile-1" },
    } as never);
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
  });

  it("retorna 429 quando rate limit estoura", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 12 });

    const res = await GET(new Request("http://localhost/api/search?q=cardio"));
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.error).toContain("Aguarde 12s");
    expect(searchProfiles).not.toHaveBeenCalled();
    expect(searchPosts).not.toHaveBeenCalled();
  });
});
