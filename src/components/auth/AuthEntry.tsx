"use client";

import Link from "next/link";
import { EmailLoginForm } from "@/components/auth/EmailLoginForm";
import { Doctor8LoginButton } from "@/components/auth/Doctor8LoginButton";

export function AuthEntry() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 360 }}>
      <Link href="/signup" className="auth-btn btn-orange" style={{ textAlign: "center", textDecoration: "none" }}>
        Criar conta com e-mail
      </Link>
      <Link href="/login" className="auth-btn btn-line" style={{ textAlign: "center", textDecoration: "none" }}>
        Entrar com e-mail
      </Link>
      <p className="signup-sub" style={{ textAlign: "center", margin: "4px 0", color: "var(--eight-muted)" }}>
        ou
      </p>
      <Doctor8LoginButton callbackUrl="/feed" fullWidth />
    </div>
  );
}
