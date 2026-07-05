import { NextResponse } from "next/server";
import { isDoctor8AuthConfigured } from "@/lib/auth/doctor8-provider";

export async function GET() {
  return NextResponse.json({
    doctor8: isDoctor8AuthConfigured(),
  });
}
