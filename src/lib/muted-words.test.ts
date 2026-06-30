import { describe, expect, it } from "vitest";
import {
  filterPostsByMutedWords,
  postMatchesMutedWords,
} from "@/lib/muted-words";

describe("postMatchesMutedWords", () => {
  it("detecta palavra no corpo", () => {
    expect(postMatchesMutedWords("Isso é spam puro", ["spam"])).toBe(true);
  });

  it("é case-insensitive", () => {
    expect(postMatchesMutedWords("SPAM aqui", ["spam"])).toBe(true);
  });

  it("retorna false sem palavras", () => {
    expect(postMatchesMutedWords("texto normal", [])).toBe(false);
  });
});

describe("filterPostsByMutedWords", () => {
  const posts = [
    { id: "1", body: "Caso clínico interessante" },
    { id: "2", body: "Oferta de spam médico" },
    { id: "3", body: "Discussão sobre cardiologia" },
  ];

  it("remove posts que batem com palavras silenciadas", () => {
    const filtered = filterPostsByMutedWords(posts, ["spam"]);
    expect(filtered.map((p) => p.id)).toEqual(["1", "3"]);
  });

  it("retorna tudo quando não há palavras", () => {
    expect(filterPostsByMutedWords(posts, [])).toHaveLength(3);
  });
});
