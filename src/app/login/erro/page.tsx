"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Logo from "@/components/Logo";
import { Doctor8LoginButton } from "@/components/auth/Doctor8LoginButton";
import { getAuthErrorMessage } from "@/lib/auth-errors";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") ?? "unknown";
  const message = getAuthErrorMessage(error) ?? getAuthErrorMessage("unknown");

  return (
    <div
      className="screen"
      style={{ fontFamily: "var(--font-body), system-ui, sans-serif", gridTemplateColumns: "1fr" }}
    >
      <div className="left" style={{ maxWidth: 420, margin: "0 auto", width: "100%" }}>
        <div className="brand">
          <Logo size={34} />
          <b style={{ fontFamily: "var(--font-display)" }}>eight</b>
        </div>
        <h1 className="h1" style={{ fontFamily: "var(--font-display)", fontSize: 28 }}>
          Erro no login
        </h1>
        <p className="lede" style={{ marginBottom: 24 }}>
          {message}
        </p>
        <Doctor8LoginButton callbackUrl="/feed" />
        <p className="signin" style={{ marginTop: 20 }}>
          <Link href="/contato">Precisa de ajuda? Contato</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginErrorPage() {
  return (
    <Suspense fallback={<p className="lede">…</p>}>
      <ErrorContent />
    </Suspense>
  );
}
