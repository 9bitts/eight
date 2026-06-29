import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/password-reset";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`reset:${ip}`, 10, 15 * 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  try {
    const body = (await req.json()) as {
      email?: string;
      token?: string;
      password?: string;
    };
    const email = body.email?.trim() ?? "";
    const token = body.token?.trim() ?? "";
    const password = body.password ?? "";

    if (!email || !token || !password) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    await resetPasswordWithToken(email, token, password);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Não foi possível redefinir a senha.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
