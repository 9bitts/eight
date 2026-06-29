import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.profileId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  if (!q) return NextResponse.json([]);

  const profiles = await prisma.profile.findMany({
    where: {
      suspended: false,
      id: { not: session.user.profileId },
      OR: [
        { handle: { startsWith: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 6,
    select: {
      handle: true,
      displayName: true,
      verified: true,
      specialty: true,
    },
    orderBy: [{ verified: "desc" }, { displayName: "asc" }],
  });

  return NextResponse.json(profiles);
}
