import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PROTECTED = ["/feed", "/explore", "/notifications", "/messages", "/cases", "/settings", "/post", "/verificacao", "/admin", "/listas", "/agendados", "/salvos", "/analytics"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isSuspended = !!req.auth?.user?.suspended;

  if (isSuspended && pathname !== "/login/erro") {
    const login = new URL("/login/erro", req.nextUrl.origin);
    login.searchParams.set("error", "SuspendedAccount");
    return NextResponse.redirect(login);
  }

  const isProtected = PROTECTED.some((p) => {
    if (p === "/listas") {
      return pathname === "/listas" || pathname === "/listas/";
    }
    return pathname.startsWith(p);
  });
  const isAuthPage =
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/signup";

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
    "/explore/:path*",
    "/notifications",
    "/messages/:path*",
    "/cases",
    "/settings",
    "/listas/:path*",
    "/agendados",
    "/salvos",
    "/analytics",
    "/post/:path*",
    "/login",
    "/login/:path*",
    "/signup",
    "/signup/complete",
    "/verificacao",
    "/admin/:path*",
  ],
};
