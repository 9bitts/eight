import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPushConfigured } from "@/lib/push";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.profileId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push não configurado no servidor." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const endpoint = body?.endpoint as string | undefined;
  const keys = body?.keys as { p256dh?: string; auth?: string } | undefined;
  const p256dh = keys?.p256dh;
  const authKey = keys?.auth;

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: "Dados de inscrição inválidos." }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      profileId: session.user.profileId,
      endpoint,
      p256dh,
      auth: authKey,
    },
    update: {
      profileId: session.user.profileId,
      p256dh,
      auth: authKey,
    },
  });

  return NextResponse.json({ ok: true });
}
