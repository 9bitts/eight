import Link from "next/link";
import Logo from "@/components/Logo";
import { EightJourney } from "@/components/landing/EightJourney";

const CHIPS: { label: string; top: string; left: string; delay: string }[] = [
  { label: "SNCR · receita digital", top: "18%", left: "8%", delay: "0s" },
  { label: "FHIR · API aberta", top: "30%", left: "82%", delay: "1.4s" },
  { label: "PCMSO · eSocial", top: "62%", left: "10%", delay: "2.6s" },
  { label: "NR-1 · EAP", top: "72%", left: "80%", delay: "0.8s" },
  { label: "ICP-Brasil", top: "46%", left: "4%", delay: "3.4s" },
  { label: "Telemedicina 24/7", top: "50%", left: "88%", delay: "2s" },
];

export default function Home() {
  return (
    <>
      <section className="land-hero" style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}>
        <div className="land-hero-bg" aria-hidden="true" />
        <div className="land-hero-glow b" aria-hidden="true" />
        <div className="land-hero-glow o" aria-hidden="true" />

        {CHIPS.map((c) => (
          <span
            key={c.label}
            className="land-chip"
            style={{ top: c.top, left: c.left, animationDelay: c.delay }}
            aria-hidden="true"
          >
            {c.label}
          </span>
        ))}

        <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "center", paddingTop: 36 }}>
          <Link href="/" className="brand" style={{ textDecoration: "none", color: "var(--txt)" }}>
            <Logo size={30} />
            <b style={{ fontFamily: "var(--font-display)" }}>eight</b>
          </Link>
        </div>

        <div className="land-hero-inner">
          <span className="badge-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#2a90b0">
              <path d="M12 2l2.4 2.1 3.1-.5 1 3 2.7 1.6-1 3 1 3-2.7 1.6-1 3-3.1-.5L12 22l-2.4-2.1-3.1.5-1-3L2.8 14.3l1-3-1-3 2.7-1.6 1-3 3.1.5z" />
              <path d="M9.5 12l1.8 1.8 3.4-3.6" stroke="#0a242e" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            8 domínios, 1 plataforma
          </span>

          <h1 className="h1" style={{ fontFamily: "var(--font-display)" }}>
            O <em>8</em> da saúde brasileira: do primeiro sintoma à farmácia.
          </h1>
          <p className="lede">
            Doctor8 fecha o circuito que ninguém fecha — cuidado, prescrição, farmácia, corporativo
            e ocupacional em um único organismo digital.
          </p>

          <div className="land-hero-ctas">
            <Link href="/signup" className="land-btn land-btn-primary">
              Acessar a Rede Eight
            </Link>
            <Link href="/login" className="land-btn land-btn-ghost">
              Doctor8 Plataform
            </Link>
          </div>
        </div>

        <div className="land-scroll-cue">
          <span>role para explorar os 8 pilares</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4v16M5 13l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      <EightJourney />

      <section className="land-closing">
        <div className="land-closing-inner">
          <h2 className="h1" style={{ fontFamily: "var(--font-display)" }}>
            Não são 8 produtos. <em>É um organismo.</em>
          </h2>
          <p className="lede" style={{ margin: "0 auto 32px", textAlign: "center" }}>
            Uma pesquisa de NR-1, uma sessão de EAP, uma receita SNCR e uma dispensação em farmácia —
            tudo no mesmo fluxo, com o sigilo do paciente preservado do início ao fim.
          </p>
          <div className="land-hero-ctas">
            <Link href="/signup" className="land-btn land-btn-primary">
              Começar agora
            </Link>
            <Link href="/sobre" className="land-btn land-btn-ghost">
              Conhecer a Doctor8
            </Link>
          </div>
        </div>
      </section>

      <footer className="foot" style={{ position: "static", background: "var(--ink)" }}>
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
