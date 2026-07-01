import { isUniqueViolation } from "@/lib/prisma-errors";

/** Toggle idempotente: remove se existir; senão cria (ignora corrida em constraint única). */
export async function toggleUniqueRecord(
  remove: () => Promise<{ count: number }>,
  add: () => Promise<void>
): Promise<boolean> {
  const removed = await remove();
  if (removed.count > 0) return false;

  try {
    await add();
    return true;
  } catch (error) {
    if (isUniqueViolation(error)) return false;
    throw error;
  }
}
