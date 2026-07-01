import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { VerificationStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  normalizeHandle,
  handleError,
  isValidEmail,
  passwordError,
} from "@/lib/validators";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  inviteRequired,
  validateInvite,
  createUserWithInvite,
} from "@/lib/invites";

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
  inviteCode?: string;
};

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = await rateLimit(`signup:${ip}`, 5, 60_000);
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

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
    const inviteCode = body.inviteCode?.trim() ?? "";

    if (inviteRequired()) {
      if (!inviteCode) {
        return NextResponse.json(
          { error: "Cadastro apenas por convite. Use o link enviado por e-mail." },
          { status: 403 }
        );
      }
      const check = await validateInvite(inviteCode, email);
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 403 });
      }
    } else if (inviteCode) {
      const check = await validateInvite(inviteCode, email);
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
    }

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

    const userData: Prisma.UserCreateInput = {
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
          verificationStatus: VerificationStatus.PENDING,
          verificationSubmittedAt: new Date(),
        },
      },
    };

    let user;
    if (inviteCode) {
      try {
        user = await createUserWithInvite(inviteCode, email, userData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (message.includes("Convite")) {
          return NextResponse.json({ error: message }, { status: 403 });
        }
        throw err;
      }
    } else {
      user = await prisma.user.create({
        data: userData,
        include: { profile: true },
      });
    }

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
