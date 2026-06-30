import { prisma } from "@/lib/prisma";

export type PostEditEntry = {
  id: string;
  body: string;
  editedAt: string;
};

export async function getPostEditHistory(postId: string): Promise<PostEditEntry[]> {
  const edits = await prisma.postEdit.findMany({
    where: { postId },
    orderBy: { editedAt: "desc" },
    select: { id: true, body: true, editedAt: true },
  });

  return edits.map((e) => ({
    id: e.id,
    body: e.body,
    editedAt: e.editedAt.toISOString(),
  }));
}

export async function getPostEditCount(postId: string): Promise<number> {
  return prisma.postEdit.count({ where: { postId } });
}
