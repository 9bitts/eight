"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import { isValidEmail, passwordError } from "@/lib/validators";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || loading) return;
    setError("");

    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      setError("Informe um e-mail válido.");
      return;
    }

    const passErr = passwordError(password);
    if (passErr) {
      setError(passErr);
      return;
    }

    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    submittingRef.current = true;

    try {
      const res = await fetch("/api/signup/basic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized, password }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Não foi possível criar a conta.");
        return;
      }

      const login = await signIn("credentials", {
        email: normalized,
        password,
        redirect: false,
      });

      if (!login?.ok) {
        router.push("/login?callbackUrl=/signup/complete");
        return;
      }

      router.push("/signup/complete");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
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

        <h1 className="h1" style={{ fontFamily: "var(--font-display)", fontSize: 36 }}>
          Criar conta
        </h1>
        <p className="lede" style={{ marginBottom: 28 }}>
          Cadastre-se com e-mail e senha. Depois você completa seu perfil profissional.
        </p>

        <form onSubmit={onSubmit} className="auth">
          {error && (
            <p className="signup-error" style={{ marginBottom: 8 }}>
              {error}
            </p>
          )}
          <input
            className="field"
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
          <input
            className="field"
            type="password"
            placeholder="Senha (mín. 8 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />
          <input
            className="field"
            type="password"
            placeholder="Confirmar senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />
          <button type="submit" className="auth-btn btn-orange" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spin" /> …
              </>
            ) : (
              "Criar conta"
            )}
          </button>
        </form>

        <p className="signin" style={{ marginTop: 20 }}>
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
        <p className="signin" style={{ marginTop: 12 }}>
          <Link href="/">← Voltar ao início</Link>
        </p>
      </div>
    </div>
  );
}
