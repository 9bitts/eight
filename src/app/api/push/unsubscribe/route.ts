import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.profileId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const endpoint = body?.endpoint as string | undefined;
  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint ausente." }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: { profileId: session.user.profileId, endpoint },
  });

  return NextResponse.json({ ok: true });
}
