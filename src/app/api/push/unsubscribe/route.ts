import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.profileId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const endpoint = body?.endpoint as string | undefined;
  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint ausente." }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: { profileId: session.user.profileId, endpoint },
  });

  return NextResponse.json({ ok: true });
}
