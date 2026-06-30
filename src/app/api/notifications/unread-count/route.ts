import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUnreadNotificationCount } from "@/lib/feed";

export async function GET() {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) {
    return NextResponse.json({ count: 0 });
  }

  const count = await getUnreadNotificationCount(profileId);
  return NextResponse.json({ count });
}
