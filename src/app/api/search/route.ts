import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchPosts, searchProfiles } from "@/lib/feed";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const verifiedOnly = searchParams.get("verified") === "1";

  const [profiles, posts] = await Promise.all([
    searchProfiles(q, 10, verifiedOnly, session.user.profileId),
    searchPosts(q, session.user.profileId),
  ]);

  return NextResponse.json({ profiles, posts });
}
