import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeHandle, isValidHandle } from "@/lib/validators";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("handle") ?? "";
  const handle = normalizeHandle(raw);

  if (!isValidHandle(handle)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  const taken = await prisma.profile.findUnique({ where: { handle } });
  return NextResponse.json({ available: !taken, handle });
}
