import { describe, expect, it } from "vitest";
import { scoreForYouItem } from "@/lib/feed-scoring";

const now = Date.parse("2026-06-30T12:00:00Z");

function makePost(overrides: Partial<Parameters<typeof scoreForYouItem>[0]> = {}) {
  return {
    authorId: "author-1",
    author: {
      verified: false,
      specialty: "Cardiologia",
      registrationCountry: "BR",
    },
    _count: { likes: 2, repostRecords: 1, replies: 0 },
    ...overrides,
  };
}

describe("scoreForYouItem", () => {
  it("dá mais pontos a posts recentes", () => {
    const recent = new Date(now - 2 * 3_600_000);
    const old = new Date(now - 48 * 3_600_000);
    const base = makePost();
    const recentScore = scoreForYouItem(base, recent, new Set(), "", "", now);
    const oldScore = scoreForYouItem(base, old, new Set(), "", "", now);
    expect(recentScore).toBeGreaterThan(oldScore);
  });

  it("bonifica autor seguido", () => {
    const sortAt = new Date(now - 4 * 3_600_000);
    const post = makePost();
    const plain = scoreForYouItem(post, sortAt, new Set(), "", "", now);
    const followed = scoreForYouItem(post, sortAt, new Set(["author-1"]), "", "", now);
    expect(followed).toBeGreaterThan(plain);
    expect(followed - plain).toBe(32);
  });

  it("bonifica membro de lista seguida", () => {
    const sortAt = new Date(now - 4 * 3_600_000);
    const post = makePost();
    const plain = scoreForYouItem(post, sortAt, new Set(), "", "", now, false, false);
    const fromList = scoreForYouItem(post, sortAt, new Set(), "", "", now, false, true);
    expect(fromList - plain).toBe(12);
  });

  it("bonifica repost da rede", () => {
    const sortAt = new Date(now - 4 * 3_600_000);
    const post = makePost();
    const plain = scoreForYouItem(post, sortAt, new Set(), "", "", now, false, false);
    const repost = scoreForYouItem(post, sortAt, new Set(), "", "", now, true, false);
    expect(repost - plain).toBe(18);
  });
});
