import { prisma } from "@/lib/prisma";

/** Registra visualização única por perfil (estilo X — contagem de impressões por usuário). */
export async function recordPostView(postId: string, viewerId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, hidden: true },
  });
  if (!post || post.hidden) return;

  await prisma.postView.upsert({
    where: { postId_viewerId: { postId, viewerId } },
    create: { postId, viewerId },
    update: {},
  });
}

export async function recordPostViews(postIds: string[], viewerId: string) {
  const unique = Array.from(new Set(postIds));
  await Promise.all(unique.map((id) => recordPostView(id, viewerId)));
}
