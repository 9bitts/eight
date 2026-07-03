import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    twitter: false,
    google: false,
    apple: false,
  });
}
