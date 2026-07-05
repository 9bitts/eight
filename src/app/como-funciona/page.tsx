import { LegalLayout } from "@/components/legal/LegalLayout";
import Link from "next/link";

export const metadata = { title: "Como funciona — eight" };

export default function HowItWorksPage() {
  return (
    <LegalLayout title="Como funciona">
      <ol style={{ paddingLeft: 20 }}>
        <li style={{ marginBottom: 12 }}>
          <strong>Entre com sua conta Doctor8</strong> — o login da eight usa a mesma identidade da plataforma Doctor8.
        </li>
        <li style={{ marginBottom: 12 }}>
          <strong>Complete o perfil</strong> com especialidade e registro profissional (CRM, COREN, etc.).
        </li>
        <li style={{ marginBottom: 12 }}>
          <strong>Solicite verificação</strong> em{" "}
          <Link href="/verificacao" style={{ color: "var(--blue-soft)" }}>
            Verificação profissional
          </Link>
          . Após aprovação, você recebe o selo azul.
        </li>
        <li style={{ marginBottom: 12 }}>
          <strong>Publique, siga colegas, explore</strong> por especialidade e país, participe de casos clínicos e mensagens diretas (verificados).
        </li>
      </ol>
      <p style={{ marginTop: 20 }}>
        Profissionais convidados pela Doctor8 podem receber um link de convite por e-mail para cadastro prioritário.
      </p>
    </LegalLayout>
  );
}
