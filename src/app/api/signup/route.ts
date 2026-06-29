import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  normalizeHandle,
  handleError,
  isValidEmail,
  passwordError,
} from "@/lib/validators";

type SignupBody = {
  displayName?: string;
  email?: string;
  password?: string;
  handle?: string;
  specialty?: string;
  registrationType?: string;
  registrationNumber?: string;
  registrationCountry?: string;
  location?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SignupBody;

    const displayName = body.displayName?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const handle = normalizeHandle(body.handle ?? "");
    const specialty = body.specialty?.trim() ?? "";
    const registrationType = body.registrationType?.trim() ?? "";
    const registrationNumber = body.registrationNumber?.trim() ?? "";
    const registrationCountry = body.registrationCountry?.trim() ?? "";
    const location = body.location?.trim() ?? "";

    if (!displayName || displayName.length < 2) {
      return NextResponse.json({ error: "Informe seu nome completo." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }
    const passErr = passwordError(password);
    if (passErr) return NextResponse.json({ error: passErr }, { status: 400 });

    const hErr = handleError(handle);
    if (hErr) return NextResponse.json({ error: hErr }, { status: 400 });

    if (!specialty) {
      return NextResponse.json({ error: "Informe sua especialidade ou área." }, { status: 400 });
    }
    if (!registrationType || !registrationNumber) {
      return NextResponse.json(
        { error: "Informe seu registro profissional (tipo e número)." },
        { status: 400 }
      );
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Este e-mail já está em uso. Tente entrar na sua conta." },
        { status: 409 }
      );
    }

    const existingHandle = await prisma.profile.findUnique({ where: { handle } });
    if (existingHandle) {
      return NextResponse.json(
        { error: "Este @nome já está em uso. Escolha outro." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: displayName,
        email,
        passwordHash,
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
      include: { profile: true },
    });

    return NextResponse.json({
      ok: true,
      userId: user.id,
      handle: user.profile?.handle,
    });
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json(
      { error: "Não foi possível criar a conta. Tente novamente." },
      { status: 500 }
    );
  }
}
