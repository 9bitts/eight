import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import { EightJourney } from "@/components/landing/EightJourney";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata(
  "",
  "eight — A rede dos profissionais de saúde",
  "A rede dos profissionais de saúde. Conhecimento, casos e conexões verificadas, no seu idioma, em qualquer país."
);

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
            <Link href="/login" className="land-btn land-btn-primary">
              Acessar a Rede Eight
            </Link>
            <a
              href="https://app.doctor8.org/register/professional/signup"
              className="land-btn land-btn-ghost"
            >
              Doctor8 Plataform
            </a>
          </div>

          <div className="land-whatsapp-row">
            <a
              href="https://wa.me/5531971720053?text=Ol%C3%A1!%20Quero%20falar%20com%20a%20equipe%20Doctor8%20ou%20fazer%20uma%20consulta."
              target="_blank"
              rel="noopener noreferrer"
              className="land-btn land-btn-whatsapp"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.47 14.38c-.29-.15-1.72-.85-1.99-.94-.27-.1-.46-.15-.66.15-.2.29-.75.94-.92 1.13-.17.2-.34.22-.63.07-.29-.15-1.22-.45-2.32-1.43-.86-.77-1.44-1.71-1.6-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.07-.15-.66-1.59-.9-2.18-.24-.57-.48-.5-.66-.51h-.56c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.43 0 1.43 1.04 2.82 1.19 3.01.15.2 2.05 3.13 4.96 4.39.69.3 1.23.48 1.65.61.69.22 1.32.19 1.82.11.55-.08 1.72-.7 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.26-.2-.55-.34z" />
                <path d="M12.01 2C6.49 2 2.02 6.47 2.02 12c0 1.94.55 3.75 1.51 5.29L2 22l4.86-1.48A9.94 9.94 0 0 0 12.01 22C17.53 22 22 17.53 22 12S17.53 2 12.01 2zm0 18.13c-1.72 0-3.32-.5-4.67-1.36l-.33-.2-3.03.92.93-2.96-.22-.34a8.14 8.14 0 0 1-1.27-4.19c0-4.51 3.68-8.19 8.2-8.19 4.51 0 8.18 3.68 8.18 8.19 0 4.5-3.67 8.13-8.19 8.13z" />
              </svg>
              Falar com a equipe ou fazer uma consulta
            </a>
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
            <a
              href="https://app.doctor8.org/register/professional/signup"
              className="land-btn land-btn-primary"
            >
              Entre na Doctor8
            </a>
            <Link href="/sobre" className="land-btn land-btn-ghost">
              Conhecer a Doctor8
            </Link>
          </div>
        </div>
      </section>

      <footer className="foot" style={{ position: "static", background: "var(--ink)" }}>
        <Link href="/sobre">Sobre</Link>
        <Link href="/como-funciona">Como funciona</Link>
        <Link href="/regras">Regras</Link>
        <Link href="/termos">Termos</Link>
        <Link href="/privacidade">Privacidade</Link>
        <Link href="/contato">Contato</Link>
        <span>© 2026 eight · Doctor8 · doctor8.com.br</span>
      </footer>
    </>
  );
}
