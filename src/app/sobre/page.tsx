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
    </LegalLayout>
  );
}
