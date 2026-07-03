"use client";

import Link from "next/link";

export function AuthEntry() {
  return (
    <div className="auth">
      <Link href="/signup" className="auth-btn btn-orange" style={{ textDecoration: "none" }}>
        Criar conta com e-mail →
      </Link>
    </div>
  );
}
