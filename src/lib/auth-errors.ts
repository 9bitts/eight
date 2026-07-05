/** Mensagens amigáveis para códigos de erro do Auth.js na URL (?error=). */
export function getAuthErrorMessage(error: string | null | undefined): string | null {
  if (!error) return null;

  const messages: Record<string, string> = {
    OAuthSignin: "Não foi possível iniciar o login. Tente novamente.",
    OAuthCallback:
      "A Doctor8 recusou ou cancelou a autenticação. Verifique se sua conta é de profissional de saúde.",
    OAuthCallbackError:
      "A Doctor8 recusou o acesso. A eight é exclusiva para profissionais de saúde — use uma conta Doctor8 com perfil profissional (médico, psicólogo, terapeuta ou admin).",
    OAuthAccountNotLinked:
      "Este e-mail já está vinculado a outra conta. Entre com a Doctor8.",
    AccessDenied:
      "Acesso negado. A eight é exclusiva para profissionais de saúde com conta Doctor8.",
    Configuration: "Erro de configuração do servidor. Contate o suporte.",
    SuspendedAccount:
      "Sua conta foi suspensa por violação das regras da plataforma. Entre em contato com suporte@doctor8.com.br.",
  };

  return messages[error] ?? "Não foi possível entrar. Tente novamente.";
}
