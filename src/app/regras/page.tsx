import { LegalLayout } from "@/components/legal/LegalLayout";

export const metadata = { title: "Regras da Comunidade — eight" };

export default function RulesPage() {
  return (
    <LegalLayout title="Regras da Comunidade">
      <p>A eight é um espaço profissional. Ao participar, você concorda com:</p>
      <ul style={{ paddingLeft: 20, marginTop: 16 }}>
        <li><strong>Respeito:</strong> sem assédio, discriminação ou ataques pessoais.</li>
        <li><strong>Privacidade do paciente:</strong> nunca publique nome, foto, CPF, telefone ou dados que identifiquem pacientes.</li>
        <li><strong>Casos clínicos:</strong> use a área de Casos e mantenha anonimização; o sistema bloqueia CPF e telefones automaticamente.</li>
        <li><strong>Veracidade:</strong> não espalhe desinformação sobre saúde, tratamentos ou medicamentos.</li>
        <li><strong>Profissionalismo:</strong> conteúdo deve ser relevante à prática e à comunidade de saúde.</li>
      </ul>
      <p style={{ marginTop: 20 }}>
        Violações podem resultar em remoção de conteúdo, perda do selo verificado ou banimento.
        Use o botão <strong>Denunciar</strong> em posts e perfis para reportar abusos.
      </p>
    </LegalLayout>
  );
}
