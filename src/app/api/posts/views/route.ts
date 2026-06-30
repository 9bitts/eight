import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { recordPostViews } from "@/lib/post-views";

export async function POST(req: Request) {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: { postIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const postIds = (body.postIds ?? []).filter((id) => typeof id === "string").slice(0, 20);
  if (postIds.length === 0) {
    return NextResponse.json({ ok: true, recorded: 0 });
  }

  await recordPostViews(postIds, profileId);
  return NextResponse.json({ ok: true, recorded: postIds.length });
}
