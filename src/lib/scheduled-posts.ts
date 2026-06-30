import { prisma } from "@/lib/prisma";

/** Publica posts agendados cujo horário já passou (limpa scheduledAt). */
export async function publishDueScheduledPosts(): Promise<number> {
  const now = new Date();
  const result = await prisma.post.updateMany({
    where: {
      scheduledAt: { not: null, lte: now },
    },
    data: { scheduledAt: null },
  });
  return result.count;
}
