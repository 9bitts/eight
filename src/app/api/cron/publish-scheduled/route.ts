import { NextResponse } from "next/server";
import { publishDueScheduledPosts } from "@/lib/scheduled-posts";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const published = await publishDueScheduledPosts();
  return NextResponse.json({ ok: true, published });
}
