import { prisma } from "@/lib/prisma";

/** Publica posts agendados cujo horário já passou (limpa scheduledAt). */
export async function publishDueScheduledPosts() {
  const now = new Date();
  await prisma.post.updateMany({
    where: {
      scheduledAt: { not: null, lte: now },
    },
    data: { scheduledAt: null },
  });
}
