import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isValidEmail, passwordError } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = await rateLimit(`signup-basic:${ip}`, 8, 60_000);
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    const passErr = passwordError(password);
    if (passErr) return NextResponse.json({ error: passErr }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Este e-mail já está em uso. Tente entrar na sua conta." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[signup/basic]", err);
    const code = (err as { code?: string }).code;
    if (code === "P2022") {
      return NextResponse.json(
        { error: "Banco de dados desatualizado. Aguarde o deploy ou contate o suporte." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Não foi possível criar a conta." }, { status: 500 });
  }
}
