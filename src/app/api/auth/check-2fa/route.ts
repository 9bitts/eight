import { NextResponse } from "next/server";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = await rateLimit(`check2fa:${ip}`, 20, 60_000);
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);
  } catch {
    // 2FA desativado temporariamente — não bloquear login por falha auxiliar
  }

  return NextResponse.json({ needs2fa: false });
}
