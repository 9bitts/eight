import Link from "next/link";
import Logo from "@/components/Logo";

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

          <div className="auth">
            <button className="auth-btn btn-white">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C17.1 2.9 14.8 2 12 2 6.9 2 2.8 6.1 2.8 11.9S6.9 21.8 12 21.8c6.9 0 9.2-4.8 9.2-7.3 0-.5 0-.9-.1-1.3H12z" />
              </svg>
              Continuar com Google
            </button>
            <button className="auth-btn btn-line">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .7 1.1 1.6 2.3 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.6.7 2.8.7c1.1 0 1.9-1.1 2.6-2.1.8-1.2 1.2-2.4 1.2-2.4s-2.3-.9-2.4-3.7zM14.2 5.9c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 0 1.9-.5 2.5-1.2z" />
              </svg>
              Continuar com a Apple
            </button>
            <div className="divider">ou</div>
            <input className="field" type="email" placeholder="E-mail profissional" />
            <Link href="/signup" className="auth-btn btn-orange" style={{ textDecoration: "none" }}>
              Criar conta profissional →
            </Link>
          </div>

          <p className="signin">
            Já faz parte? <Link href="/login">Entrar</Link>
          </p>

          <p className="legal">
            Ao continuar, você concorda com os <a href="#">Termos</a> e a{" "}
            <a href="#">Política de Privacidade</a> da eight. Seu registro profissional
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
        <a href="#">Sobre</a>
        <a href="#">Como funciona</a>
        <a href="#">Verificação</a>
        <a href="#">Termos</a>
        <a href="#">Privacidade</a>
        <a href="#">Contato</a>
        <span>© 2026 eight · Doctor8 · doctor8.com.br</span>
      </footer>
    </>
  );
}
