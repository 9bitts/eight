"use client";

import { Suspense, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/feed";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("E-mail ou senha incorretos.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <>
      <OAuthButtons mode="login" callbackUrl={callbackUrl} />
      <div className="divider">ou com e-mail</div>
      <form onSubmit={onSubmit} className="auth">
        {error && <p className="signup-error" style={{ marginBottom: 8 }}>{error}</p>}
        <input
          className="field"
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <input
          className="field"
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="auth-btn btn-orange" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={18} className="spin" /> Entrando…
            </>
          ) : (
            "Entrar com e-mail"
          )}
        </button>
      </form>
    </>
  );
}

export default function LoginPage() {
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

        <h1 className="h1" style={{ fontFamily: "var(--font-display)", fontSize: 36 }}>
          Entrar na <em>eight</em>
        </h1>
        <p className="lede" style={{ marginBottom: 28 }}>
          A rede dos profissionais de saúde verificados.
        </p>

        <Suspense fallback={<p className="lede">Carregando…</p>}>
          <LoginContent />
        </Suspense>

        <p className="signin">
          Não tem conta? <Link href="/signup">Criar conta</Link>
        </p>
        <p className="signin" style={{ marginTop: 12 }}>
          <Link href="/">← Voltar ao início</Link>
        </p>
      </div>
    </div>
  );
}
