import { prisma } from "@/lib/prisma";

export async function getMutedWords(profileId: string): Promise<string[]> {
  const rows = await prisma.mutedWord.findMany({
    where: { profileId },
    select: { word: true },
  });
  return rows.map((r) => r.word.toLowerCase());
}

export function postMatchesMutedWords(body: string, words: string[]): boolean {
  if (words.length === 0) return false;
  const lower = body.toLowerCase();
  return words.some((w) => w && lower.includes(w));
}

export function filterPostsByMutedWords<T extends { body: string }>(
  posts: T[],
  words: string[]
): T[] {
  if (words.length === 0) return posts;
  return posts.filter((p) => !postMatchesMutedWords(p.body, words));
}
