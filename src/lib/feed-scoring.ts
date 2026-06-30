export type ForYouScoreInput = {
  authorId: string;
  author: {
    verified: boolean;
    specialty?: string | null;
    registrationCountry?: string | null;
  };
  _count: { likes: number; repostRecords: number; replies: number };
};

export function scoreForYouItem(
  post: ForYouScoreInput,
  sortAt: Date,
  followingSet: Set<string>,
  specialty: string,
  country: string,
  now: number,
  fromNetworkRepost = false,
  fromFollowedListMember = false
): number {
  let score = 0;
  const hours = (now - sortAt.getTime()) / 3_600_000;

  score += Math.max(0, 72 - hours) * 1.4;
  if (hours < 8) score += 10;
  if (post.author.verified) score += 14;
  if (followingSet.has(post.authorId)) score += 32;
  if (specialty && post.author.specialty?.toLowerCase() === specialty) score += 20;
  if (country && post.author.registrationCountry === country) score += 8;
  score += (post._count.likes + post._count.repostRecords * 2 + post._count.replies) * 2.5;
  if (fromNetworkRepost) score += 18;
  if (fromFollowedListMember) score += 12;

  return score;
}
