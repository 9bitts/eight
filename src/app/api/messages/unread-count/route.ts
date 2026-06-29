import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUnreadMessageCount } from "@/lib/messages";

export async function GET() {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) {
    return NextResponse.json({ count: 0 });
  }

  const count = await getUnreadMessageCount(profileId);
  return NextResponse.json({ count });
}
