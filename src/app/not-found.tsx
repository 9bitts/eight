import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--eight-shell-bg, #f7f9fa)",
        color: "var(--eight-ink, #0c2b36)",
        padding: 24,
        textAlign: "center",
      }}
    >
      <h1 style={{ fontWeight: 800, fontSize: 56, letterSpacing: "-0.03em" }}>404</h1>
      <p style={{ color: "var(--eight-muted, #7a8f97)", marginTop: 8, fontSize: 17 }}>
        Esta página não existe ou foi removida.
      </p>
      <div className="flex gap-3 mt-8 flex-wrap justify-center">
        <Link
          href="/feed"
          className="rounded-full px-6 py-2.5 font-bold"
          style={{ background: "#e05930", color: "#fff", textDecoration: "none", fontSize: 15 }}
        >
          Ir ao início
        </Link>
        <Link
          href="/explore"
          className="rounded-full px-6 py-2.5 font-bold"
          style={{
            border: "1px solid var(--eight-line, #e4ebee)",
            color: "#176a88",
            textDecoration: "none",
            fontSize: 15,
          }}
        >
          Explorar
        </Link>
      </div>
    </div>
  );
}
