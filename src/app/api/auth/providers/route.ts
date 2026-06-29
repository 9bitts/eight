import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    twitter: !!(process.env.AUTH_TWITTER_ID && process.env.AUTH_TWITTER_SECRET),
    google: !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    apple: !!(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET),
  });
}
