import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchPosts, searchProfiles } from "@/lib/feed";
import { SEARCH_QUERY_MAX_LENGTH } from "@/lib/constants";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const ip = clientIp(req);
  const limited = await rateLimit(`search:${session.user.id}:${ip}`, 40, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").slice(0, SEARCH_QUERY_MAX_LENGTH);
  const verifiedOnly = searchParams.get("verified") === "1";

  const [profiles, posts] = await Promise.all([
    searchProfiles(q, 10, verifiedOnly, session.user.profileId),
    searchPosts(q, session.user.profileId),
  ]);

  return NextResponse.json({ profiles, posts });
}
