import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authOk = !!process.env.AUTH_SECRET;
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      service: "eight",
      authConfigured: authOk,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { ok: false, service: "eight", authConfigured: authOk },
      { status: 503 }
    );
  }
}
