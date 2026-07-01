import { NextResponse } from "next/server";
import { publishDueScheduledPosts } from "@/lib/scheduled-posts";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { secureCompare } from "@/lib/secure-compare";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ip = clientIp(req);
  const limited = await rateLimit(`cron:${ip}`, 10, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = secret ? `Bearer ${secret}` : "";

  if (!secret || !secureCompare(authHeader, expected)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const published = await publishDueScheduledPosts();
  return NextResponse.json({ ok: true, published });
}
