"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{
        background: "var(--eight-shell-bg, #f7f9fa)",
        color: "var(--eight-ink, #0c2b36)",
        fontFamily: "var(--font-body), system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontWeight: 800, fontSize: 28 }}>Algo deu errado</h1>
      <p style={{ color: "var(--eight-muted, #7a8f97)", marginTop: 8, fontSize: 16, maxWidth: 400 }}>
        Não foi possível carregar esta página. Tente novamente em instantes.
      </p>
      <div className="flex gap-3 mt-8">
        <button
          type="button"
          onClick={reset}
          className="rounded-full px-5 py-2.5 font-bold"
          style={{ background: "#176a88", color: "#fff", border: "none", cursor: "pointer" }}
        >
          Tentar de novo
        </button>
        <Link
          href="/feed"
          className="rounded-full px-5 py-2.5 font-bold"
          style={{
            background: "var(--eight-card-bg, #fff)",
            color: "var(--eight-ink, #0c2b36)",
            border: "1px solid var(--eight-line, #e4ebee)",
            textDecoration: "none",
          }}
        >
          Ir ao feed
        </Link>
      </div>
    </div>
  );
}
