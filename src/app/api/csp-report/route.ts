import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = await rateLimit(`csp-report:${ip}`, 60, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const raw = await req.text();
  if (!raw.trim()) {
    return new Response(null, { status: 204 });
  }

  try {
    const report = JSON.parse(raw) as unknown;
    console.warn("[csp-report]", report);
  } catch {
    return new Response(null, { status: 204 });
  }

  return new Response(null, { status: 204 });
}
