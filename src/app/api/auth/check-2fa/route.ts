import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = await rateLimit(`check2fa:${ip}`, 20, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const { email, password } = (await req.json()) as {
    email?: string;
    password?: string;
  };

  const normalized = email?.trim().toLowerCase() ?? "";
  if (!normalized || !password) {
    return NextResponse.json({ needs2fa: false });
  }

  const user = await prisma.user.findUnique({
    where: { email: normalized },
    include: { profile: { select: { suspended: true } } },
  });
  if (!user?.passwordHash || user.profile?.suspended) {
    return NextResponse.json({ needs2fa: false });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ needs2fa: false });

  return NextResponse.json({ needs2fa: user.totpEnabled });
}
