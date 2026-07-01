import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeHandle, isValidHandle } from "@/lib/validators";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const ip = clientIp(req);
  const limited = await rateLimit(`handle-check:${ip}`, 30, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("handle") ?? "";
  const handle = normalizeHandle(raw);

  if (!isValidHandle(handle)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  const taken = await prisma.profile.findUnique({ where: { handle } });
  return NextResponse.json({ available: !taken, handle });
}
