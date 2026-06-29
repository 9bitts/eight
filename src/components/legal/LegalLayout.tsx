import Link from "next/link";
import Logo from "@/components/Logo";

export function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--ink, #0a242e)",
        color: "var(--txt, #eaf3f6)",
        fontFamily: "var(--font-body), system-ui, sans-serif",
      }}
    >
      <header className="px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,.1)" }}>
        <Link href="/" className="brand" style={{ textDecoration: "none", color: "inherit" }}>
          <Logo size={28} />
          <b style={{ fontFamily: "var(--font-display)", marginLeft: 10 }}>eight</b>
        </Link>
      </header>
      <main className="mx-auto px-6 py-10" style={{ maxWidth: 720, lineHeight: 1.65 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 32,
            marginBottom: 24,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
        <div style={{ fontSize: 15, color: "var(--muted, #8fb0bb)" }}>{children}</div>
      </main>
      <footer className="foot">
        <Link href="/">Início</Link>
        <Link href="/sobre">Sobre</Link>
        <Link href="/regras">Regras</Link>
        <Link href="/termos">Termos</Link>
        <Link href="/privacidade">Privacidade</Link>
        <Link href="/contato">Contato</Link>
        <span>© 2026 eight · Doctor8</span>
      </footer>
    </div>
  );
}
