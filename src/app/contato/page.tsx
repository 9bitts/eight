import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata("/contato", "Contato — eight");

export default function ContactPage() {
  return (
    <LegalLayout title="Contato">
      <p>Entre em contato com a equipe Doctor8 / eight:</p>
      <ul style={{ marginTop: 16, listStyle: "none", paddingLeft: 0 }}>
        <li style={{ marginBottom: 12 }}>
          <strong>Suporte geral:</strong>{" "}
          <a href="mailto:suporte@doctor8.com.br" style={{ color: "var(--blue-soft)" }}>
            suporte@doctor8.com.br
          </a>
        </li>
        <li style={{ marginBottom: 12 }}>
          <strong>Verificação profissional:</strong>{" "}
          <a href="mailto:verificacao@doctor8.com.br" style={{ color: "var(--blue-soft)" }}>
            verificacao@doctor8.com.br
          </a>
        </li>
        <li style={{ marginBottom: 12 }}>
          <strong>Privacidade (LGPD):</strong>{" "}
          <a href="mailto:privacidade@doctor8.com.br" style={{ color: "var(--blue-soft)" }}>
            privacidade@doctor8.com.br
          </a>
        </li>
        <li>
          <strong>Site:</strong>{" "}
          <a href="https://doctor8.com.br" style={{ color: "var(--blue-soft)" }}>
            doctor8.com.br
          </a>
        </li>
      </ul>
    </LegalLayout>
  );
}
