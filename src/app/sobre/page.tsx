import { LegalLayout } from "@/components/legal/LegalLayout";

export const metadata = { title: "Sobre — eight" };

export default function AboutPage() {
  return (
    <LegalLayout title="Sobre a eight">
      <p>
        A <strong>eight</strong> é a rede social da <strong>Doctor8</strong> para profissionais de
        saúde verificados — médicos, enfermeiros, psicólogos, fisioterapeutas e demais categorias
        com registro profissional.
      </p>
      <p style={{ marginTop: 16 }}>
        Nosso objetivo é conectar quem cuida: compartilhar conhecimento, discutir casos clínicos de
        forma responsável, encontrar colegas da mesma especialidade e região, e fortalecer a
        comunidade da saúde no Brasil e no mundo.
      </p>
      <p style={{ marginTop: 16 }}>
        Todo perfil com selo verificado passou por conferência do registro profissional (CRM, COREN,
        CRP, etc.) pela equipe Doctor8.
      </p>

      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 24,
          letterSpacing: "-0.02em",
          color: "var(--txt, #eaf3f6)",
          marginTop: 44,
          marginBottom: 14,
        }}
      >
        A Doctor8 e os 8 pilares
      </h2>
      <p>
        A eight é a porta de entrada da <strong>Doctor8</strong>, o ecossistema de saúde que conecta,
        em uma única plataforma, o caminho completo do cuidado: do primeiro sintoma até a farmácia,
        da consulta ao ambiente de trabalho, do paciente ao RH. Em vez de resolver só um pedaço da
        jornada de saúde, a Doctor8 organiza esse caminho em 8 pilares que se alimentam entre si.
      </p>

      <ol
        style={{
          marginTop: 24,
          display: "grid",
          gap: 18,
          listStyle: "none",
          padding: 0,
        }}
      >
        {[
          {
            n: 1,
            name: "Cuidado",
            desc: "Telemedicina e marketplace de consultas com 9+ especialidades, incluindo plantão sob demanda.",
          },
          {
            n: 2,
            name: "Prescrição",
            desc: "Receita digital com certificação ICP-Brasil, exames e atestados integrados ao SNCR.",
          },
          {
            n: 3,
            name: "Farmácia",
            desc: "Dispensação, rede de farmácias parceiras, compra online e delivery de medicamentos.",
          },
          {
            n: 4,
            name: "Institucional",
            desc: "Integração com hospitais, clínicas, operadoras de saúde, SUS e secretarias municipais.",
          },
          {
            n: 5,
            name: "Corporativo",
            desc: "Programas de NR-1, EAP (apoio psicológico ao colaborador), pesquisas e canais de denúncia.",
          },
          {
            n: 6,
            name: "Ocupacional",
            desc: "PCMSO, exames ocupacionais, ASO e integração com eSocial e médicos do trabalho.",
          },
          {
            n: 7,
            name: "Educação",
            desc: "Cursos, trilhas psicoeducativas e certificação para profissionais e pacientes.",
          },
          {
            n: 8,
            name: "Ecossistema",
            desc: "Integrações abertas via FHIR, webhooks e API para parceiros e iniciativas humanitárias.",
          },
        ].map((p) => (
          <li
            key={p.n}
            style={{
              display: "flex",
              gap: 16,
              alignItems: "flex-start",
              paddingBottom: 18,
              borderBottom: "1px solid rgba(255,255,255,.08)",
            }}
          >
            <span
              style={{
                flex: "0 0 auto",
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "rgba(224,89,48,.14)",
                border: "1px solid rgba(224,89,48,.3)",
                color: "#f3a78f",
                fontWeight: 800,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display)",
              }}
            >
              {p.n}
            </span>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 17,
                  color: "var(--txt, #eaf3f6)",
                  marginBottom: 4,
                }}
              >
                {p.name}
              </div>
              <div style={{ fontSize: 14.5, lineHeight: 1.55 }}>{p.desc}</div>
            </div>
          </li>
        ))}
      </ol>

      <p style={{ marginTop: 24 }}>
        Nenhum desses pilares funciona isolado: uma pesquisa de NR-1 pode originar uma sessão de EAP,
        que gera uma prescrição SNCR, que se resolve em uma farmácia parceira — tudo no mesmo fluxo,
        com o sigilo do paciente preservado do início ao fim.
      </p>
    </LegalLayout>
  );
}
