import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PROTECTED = ["/feed", "/explore", "/notifications", "/messages", "/cases", "/settings", "/post"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isProtected && !isLoggedIn) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/feed", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/feed/:path*",
    "/explore",
    "/notifications",
    "/messages",
    "/cases",
    "/settings",
    "/post/:path*",
    "/login",
    "/signup",
    "/signup/complete",
  ],
};
