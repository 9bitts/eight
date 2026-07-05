import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handleError, normalizeHandle } from "@/lib/validators";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { inviteRequired, markInviteUsed, validateInvite } from "@/lib/invites";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Faça login primeiro." }, { status: 401 });
  }

  const ip = clientIp(req);
  const limited = await rateLimit(`signup-complete:${session.user.id}:${ip}`, 10, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const existing = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) {
    return NextResponse.json({ error: "Perfil já configurado." }, { status: 409 });
  }

  const userEmail = session.user.email?.trim().toLowerCase();
  let inviteCode: string | undefined;

  if (inviteRequired()) {
    if (!userEmail) {
      return NextResponse.json({ error: "E-mail da conta Doctor8 não disponível." }, { status: 403 });
    }
    inviteCode = cookies().get("eight_invite")?.value?.trim();
    if (!inviteCode) {
      return NextResponse.json({ error: "Convite necessário para criar perfil." }, { status: 403 });
    }
    const check = await validateInvite(inviteCode, userEmail);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 403 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const displayName = (body.displayName as string)?.trim() || session.user.name?.trim() || "Profissional";
  const handle = normalizeHandle((body.handle as string) ?? "");
  const specialty = (body.specialty as string)?.trim() ?? "";
  const registrationType = (body.registrationType as string)?.trim() ?? "";
  const registrationNumber = (body.registrationNumber as string)?.trim() ?? "";
  const registrationCountry = (body.registrationCountry as string)?.trim() ?? "";
  const location = (body.location as string)?.trim() ?? "";

  const hErr = handleError(handle);
  if (hErr) return NextResponse.json({ error: hErr }, { status: 400 });
  if (!specialty) {
    return NextResponse.json({ error: "Informe sua especialidade." }, { status: 400 });
  }
  if (!registrationType || !registrationNumber) {
    return NextResponse.json({ error: "Informe seu registro profissional." }, { status: 400 });
  }

  const taken = await prisma.profile.findUnique({ where: { handle } });
  if (taken) {
    return NextResponse.json({ error: "Este @nome já está em uso." }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: displayName,
      profile: {
        create: {
          handle,
          displayName,
          specialty,
          registrationType,
          registrationNumber,
          registrationCountry: registrationCountry || null,
          location: location || null,
          verified: false,
          verificationStatus: "PENDING",
          verificationSubmittedAt: new Date(),
        },
      },
    },
  });

  if (inviteCode) {
    await markInviteUsed(inviteCode, session.user.id);
  }

  return NextResponse.json({ ok: true, handle });
}
