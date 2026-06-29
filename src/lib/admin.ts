import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function isAdminUser(userId: string, email?: string | null): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, email: true },
  });
  if (!user) return false;
  if (user.isAdmin) return true;

  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean) ?? [];

  const checkEmail = (email ?? user.email).toLowerCase();
  return adminEmails.includes(checkEmail);
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autorizado");

  const ok = await isAdminUser(session.user.id, session.user.email);
  if (!ok) throw new Error("Acesso restrito à equipe Doctor8");

  return session.user.id;
}
