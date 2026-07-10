"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Stethoscope,
  FileText,
  Pill,
  Building2,
  Briefcase,
  HardHat,
  GraduationCap,
  Network,
} from "lucide-react";

type Pillar = {
  n: number;
  name: string;
  icon: typeof Stethoscope;
  desc: string;
  status: "Maduro" | "Em expansão" | "Parcial" | "Inicial" | "Ausente";
};

const PILLARS: Pillar[] = [
  { n: 1, name: "Cuidado", icon: Stethoscope, desc: "Telemedicina e consultas com 9+ especialidades.", status: "Maduro" },
  { n: 2, name: "Prescrição", icon: FileText, desc: "Receita digital ICP-Brasil, exames e atestados.", status: "Parcial" },
  { n: 3, name: "Farmácia", icon: Pill, desc: "Dispensação, rede parceira e delivery.", status: "Inicial" },
  { n: 4, name: "Institucional", icon: Building2, desc: "Hospitais, clínicas, operadoras e SUS.", status: "Ausente" },
  { n: 5, name: "Corporativo", icon: Briefcase, desc: "NR-1, EAP, pesquisas e conformidade.", status: "Em expansão" },
  { n: 6, name: "Ocupacional", icon: HardHat, desc: "PCMSO, ASO, eSocial e médico do trabalho.", status: "Em expansão" },
  { n: 7, name: "Educação", icon: GraduationCap, desc: "Cursos, trilhas psicoeducativas e certificação.", status: "Parcial" },
  { n: 8, name: "Ecossistema", icon: Network, desc: "FHIR, webhooks, API aberta e parceiros.", status: "Parcial" },
];

const STATUS_DOT: Record<Pillar["status"], string> = {
  Maduro: "#3ecf8e",
  "Em expansão": "#e0b02a",
  Parcial: "#e0b02a",
  Inicial: "#e05930",
  Ausente: "#e05930",
};

const CX = 200;
const CY = 250;
const A = 150;

function pointAt(t: number) {
  const x = (A * Math.sin(t) * Math.cos(t)) + CX;
  const y = A * Math.sin(t) + CY;
  return { x, y };
}

const SAMPLES = 240;

export function EightJourney() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<SVGCircleElement>(null);
  const markerGlowRef = useRef<SVGCircleElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const rafRef = useRef<number | null>(null);

  const pathD = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const t = (i / SAMPLES) * Math.PI * 2;
      const { x, y } = pointAt(t);
      pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return pts.join(" ") + " Z";
  }, []);

  const nodes = useMemo(
    () =>
      PILLARS.map((p, i) => {
        const t = (i + 0.5) * (Math.PI / 4);
        return { ...p, ...pointAt(t) };
      }),
    []
  );

  useEffect(() => {
    function update() {
      rafRef.current = null;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
      const t = progress * Math.PI * 2;
      const { x, y } = pointAt(t);
      if (markerRef.current) {
        markerRef.current.setAttribute("cx", x.toFixed(2));
        markerRef.current.setAttribute("cy", y.toFixed(2));
      }
      if (markerGlowRef.current) {
        markerGlowRef.current.setAttribute("cx", x.toFixed(2));
        markerGlowRef.current.setAttribute("cy", y.toFixed(2));
      }
      const idx = Math.min(7, Math.max(0, Math.floor(progress * 8)));
      setActiveIndex((prev) => (prev === idx ? prev : idx));
    }

    function onScroll() {
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function goTo(i: number) {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    const targetProgress = (i + 0.5) / 8;
    const top = window.scrollY + rect.top + targetProgress * scrollable;
    window.scrollTo({ top, behavior: "smooth" });
  }

  const active = PILLARS[activeIndex];
  const ActiveIcon = active.icon;

  return (
    <section ref={sectionRef} className="land-journey" aria-label="Os 8 pilares do Doctor8">
      <div className="land-journey-sticky">
        <div className="land-journey-grid">
          <div className="land-journey-svg-wrap">
            <svg viewBox="0 0 400 500" className="land-journey-svg" aria-hidden="true">
              <defs>
                <linearGradient id="journey-line" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3eb8d4" />
                  <stop offset="100%" stopColor="#e05930" />
                </linearGradient>
                <filter id="journey-glow" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <path d={pathD} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="2" />
              <path
                d={pathD}
                fill="none"
                stroke="url(#journey-line)"
                strokeWidth="1.5"
                strokeDasharray="1 11"
                opacity="0.7"
              />

              {nodes.map((node, i) => (
                <g key={node.n} className={`land-node ${i === activeIndex ? "active" : ""}`}>
                  <circle cx={node.x} cy={node.y} r={i === activeIndex ? 15 : 9} fill="none" />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={i === activeIndex ? 9 : 5.5}
                    fill={i === activeIndex ? "#fff" : "#0f3543"}
                    stroke={i === activeIndex ? "#e05930" : "rgba(255,255,255,.35)"}
                    strokeWidth="1.5"
                    style={{ cursor: "pointer", transition: "all .3s ease" }}
                    onClick={() => goTo(i)}
                  />
                  <text
                    x={node.x}
                    y={node.y + 0.5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="8"
                    fontWeight="700"
                    fill={i === activeIndex ? "#0a242e" : "#8fb0bb"}
                    style={{ pointerEvents: "none" }}
                  >
                    {node.n}
                  </text>
                </g>
              ))}

              <circle ref={markerGlowRef} r="20" fill="url(#journey-line)" opacity="0.35" filter="url(#journey-glow)" />
              <circle ref={markerRef} r="6" fill="#fff" filter="url(#journey-glow)" />
            </svg>
          </div>

          <div className="land-panel">
            <div className="land-dots" role="tablist" aria-label="Pilares">
              {PILLARS.map((p, i) => (
                <button
                  key={p.n}
                  className={`land-dot ${i === activeIndex ? "active" : ""}`}
                  onClick={() => goTo(i)}
                  aria-label={p.name}
                  aria-selected={i === activeIndex}
                  role="tab"
                />
              ))}
            </div>

            <div className="land-panel-card" key={active.n}>
              <div className="land-panel-icon">
                <ActiveIcon size={26} strokeWidth={1.8} />
              </div>
              <div className="land-panel-num">Pilar {active.n} / 8</div>
              <h3 className="land-panel-title">{active.name}</h3>
              <p className="land-panel-desc">{active.desc}</p>
              <span className="land-panel-status">
                <i style={{ background: STATUS_DOT[active.status] }} />
                {active.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
