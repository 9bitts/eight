export default function Loading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--eight-shell-bg, #f7f9fa)", color: "var(--eight-muted, #7a8f97)" }}
    >
      <p style={{ fontSize: 15 }}>Carregando…</p>
    </div>
  );
}
