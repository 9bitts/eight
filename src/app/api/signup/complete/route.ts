import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handleError, normalizeHandle } from "@/lib/validators";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Faça login primeiro." }, { status: 401 });
  }

  const existing = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) {
    return NextResponse.json({ error: "Perfil já configurado." }, { status: 409 });
  }

  const body = await req.json();
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
        },
      },
    },
  });

  return NextResponse.json({ ok: true, handle });
}
