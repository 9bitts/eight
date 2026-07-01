import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/password-reset";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = await rateLimit(`forgot:${ip}`, 5, 15 * 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  let email = "";
  try {
    const body = (await req.json()) as { email?: string };
    email = body.email?.trim().toLowerCase() ?? "";
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }

  await requestPasswordReset(email);

  return NextResponse.json({
    ok: true,
    message:
      "Se existir uma conta com este e-mail, você receberá um link para redefinir a senha.",
  });
}
