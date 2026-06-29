"use client";

import Link from "next/link";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export function AuthEntry() {
  return (
    <div className="auth">
      <OAuthButtons mode="signup" callbackUrl="/feed" />
      <div className="divider">ou com e-mail</div>
      <Link href="/signup" className="auth-btn btn-orange" style={{ textDecoration: "none" }}>
        Criar conta com e-mail →
      </Link>
    </div>
  );
}
