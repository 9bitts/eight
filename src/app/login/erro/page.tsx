"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Logo from "@/components/Logo";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") ?? "unknown";

  const messages: Record<string, string> = {
    OAuthSignin: "Não foi possível iniciar o login social. Tente novamente.",
    OAuthCallback: "O provedor de login recusou ou cancelou a autenticação.",
    OAuthAccountNotLinked:
      "Este e-mail já está vinculado a outro método de login. Use o mesmo provedor ou e-mail/senha.",
    AccessDenied: "Acesso negado.",
    Configuration: "Erro de configuração do servidor. Contate o suporte.",
    SuspendedAccount:
      "Sua conta foi suspensa por violação das regras da plataforma. Entre em contato com suporte@doctor8.com.br.",
    unknown: "Não foi possível entrar. Tente novamente.",
  };

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
          {messages[error] ?? messages.unknown}
        </p>
        <Link href="/login" className="auth-btn btn-orange" style={{ display: "inline-block", textAlign: "center", textDecoration: "none" }}>
          Voltar ao login
        </Link>
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
