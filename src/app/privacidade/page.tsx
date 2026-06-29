import { LegalLayout } from "@/components/legal/LegalLayout";

export const metadata = { title: "Privacidade — eight" };

export default function PrivacyPage() {
  return (
    <LegalLayout title="Política de Privacidade">
      <p><strong>Última atualização:</strong> junho de 2026</p>
      <p style={{ marginTop: 16 }}>
        A Doctor8 (eight) trata seus dados em conformidade com a LGPD (Lei 13.709/2018).
      </p>
      <h2 style={{ color: "var(--txt)", fontSize: 18, marginTop: 24, marginBottom: 8 }}>Dados coletados</h2>
      <ul style={{ paddingLeft: 20, marginTop: 8 }}>
        <li>Nome, e-mail, @handle e dados profissionais (especialidade, registro)</li>
        <li>Publicações, mensagens, interações e preferências (idioma, tema)</li>
        <li>Dados técnicos de acesso (logs, IP) para segurança</li>
      </ul>
      <h2 style={{ color: "var(--txt)", fontSize: 18, marginTop: 24, marginBottom: 8 }}>Seus direitos</h2>
      <p>
        Você pode exportar ou excluir seus dados em <strong>Configurações → Seus dados (LGPD)</strong>.
        Para dúvidas: privacidade@doctor8.com.br
      </p>
      <h2 style={{ color: "var(--txt)", fontSize: 18, marginTop: 24, marginBottom: 8 }}>Compartilhamento</h2>
      <p>
        Não vendemos seus dados. Compartilhamos apenas com provedores necessários (hospedagem,
        e-mail transacional) sob contrato de proteção de dados.
      </p>
    </LegalLayout>
  );
}
