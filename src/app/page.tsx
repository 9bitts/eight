import Link from "next/link";
import Logo from "@/components/Logo";
import { AuthEntry } from "@/components/auth/AuthEntry";

export default function Home() {
  return (
    <>
      <div className="screen" style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}>
        {/* ESQUERDA */}
        <div className="left">
          <div className="brand">
            <Logo size={34} />
            <b style={{ fontFamily: "var(--font-display)" }}>eight</b>
          </div>

          <span className="badge-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#2a90b0">
              <path d="M12 2l2.4 2.1 3.1-.5 1 3 2.7 1.6-1 3 1 3-2.7 1.6-1 3-3.1-.5L12 22l-2.4-2.1-3.1.5-1-3L2.8 14.3l1-3-1-3 2.7-1.6 1-3 3.1.5z" />
              <path d="M9.5 12l1.8 1.8 3.4-3.6" stroke="#0a242e" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Só para profissionais de saúde verificados
          </span>

          <h1 className="h1" style={{ fontFamily: "var(--font-display)" }}>
            Onde quem <em>cuida</em> se encontra.
          </h1>
          <p className="lede">
            A rede dos profissionais de saúde. Conhecimento, casos e conexões reais —
            verificados, no seu idioma, em qualquer país.
          </p>

          <AuthEntry />

          <p className="signin">
            Já faz parte? <Link href="/login">Entrar</Link>
          </p>

          <p className="legal">
            Ao continuar, você concorda com os <Link href="/termos">Termos</Link> e a{" "}
            <Link href="/privacidade">Política de Privacidade</Link> da eight. Seu registro profissional
            será verificado antes da liberação do selo.
          </p>
        </div>

        {/* DIREITA */}
        <div className="right" aria-hidden="true">
          <div className="glow glow-b"></div>
          <div className="glow glow-o"></div>
          <svg className="mark" viewBox="0 0 300 420">
            <circle className="ring" cx="150" cy="130" r="95" stroke="#2a90b0" opacity=".85" />
            <circle className="ring" cx="150" cy="290" r="95" stroke="#e05930" opacity=".85" />
            <path className="pulse" d="M150 35 A95 95 0 1 1 150 225 A95 95 0 1 0 150 385 A95 95 0 1 1 150 195 A95 95 0 1 0 150 35 Z" />
          </svg>
          <div className="mark-caption">
            <div className="big" style={{ fontFamily: "var(--font-display)" }}>
              3.000+ profissionais já convidados
            </div>
            <div className="small">Brasil · Estados Unidos · Europa</div>
          </div>
        </div>
      </div>

      <footer className="foot">
        <Link href="/sobre">Sobre</Link>
        <Link href="/como-funciona">Como funciona</Link>
        <Link href="/verificacao">Verificação</Link>
        <Link href="/regras">Regras</Link>
        <Link href="/termos">Termos</Link>
        <Link href="/privacidade">Privacidade</Link>
        <Link href="/contato">Contato</Link>
        <span>© 2026 eight · Doctor8 · doctor8.com.br</span>
      </footer>
    </>
  );
}
