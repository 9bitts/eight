import { LegalLayout } from "@/components/legal/LegalLayout";

export const metadata = { title: "Termos de Uso — eight" };

export default function TermsPage() {
  return (
    <LegalLayout title="Termos de Uso">
      <p><strong>Última atualização:</strong> junho de 2026</p>
      <h2 style={{ color: "var(--txt)", fontSize: 18, marginTop: 24, marginBottom: 8 }}>1. Quem pode usar</h2>
      <p>
        A eight é destinada a profissionais de saúde. Ao criar conta, você declara possuir registro
        profissional válido na sua jurisdição.
      </p>
      <h2 style={{ color: "var(--txt)", fontSize: 18, marginTop: 24, marginBottom: 8 }}>2. Conteúdo</h2>
      <p>
        Você é responsável pelo que publica. É proibido identificar pacientes, divulgar dados
        pessoais sensíveis, praticar assédio ou disseminar informações falsas sobre saúde.
      </p>
      <h2 style={{ color: "var(--txt)", fontSize: 18, marginTop: 24, marginBottom: 8 }}>3. Verificação</h2>
      <p>
        O selo verificado não substitui responsabilidade ética ou legal. A Doctor8 pode revogar a
        verificação em caso de fraude ou violação destes termos.
      </p>
      <h2 style={{ color: "var(--txt)", fontSize: 18, marginTop: 24, marginBottom: 8 }}>4. Encerramento</h2>
      <p>
        Você pode excluir sua conta a qualquer momento em Configurações. Podemos suspender contas
        que violem as regras da comunidade.
      </p>
    </LegalLayout>
  );
}
