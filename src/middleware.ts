import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { sanitizeCallbackUrl } from "@/lib/auth-redirect";

const { auth } = NextAuth(authConfig);

const PROTECTED = ["/feed", "/explore", "/notifications", "/messages", "/cases", "/settings", "/post", "/verificacao", "/admin", "/listas", "/agendados", "/salvos", "/analytics"];

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user?.id;
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

  if (pathname === "/login") {
    const rawCb = req.nextUrl.searchParams.get("callbackUrl");
    if (rawCb) {
      const safe = sanitizeCallbackUrl(rawCb, req.nextUrl.origin);
      if (rawCb !== safe) {
        const clean = new URL("/login", req.nextUrl.origin);
        if (safe !== "/feed") clean.searchParams.set("callbackUrl", safe);
        for (const key of ["reset", "error"] as const) {
          const v = req.nextUrl.searchParams.get(key);
          if (v) clean.searchParams.set(key, v);
        }
        return NextResponse.redirect(clean);
      }
    }
  }

  if (isProtected && !isLoggedIn) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (isLoggedIn && isAuthPage) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    const dest = sanitizeCallbackUrl(callbackUrl, req.nextUrl.origin);
    return NextResponse.redirect(new URL(dest, req.nextUrl.origin));
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
