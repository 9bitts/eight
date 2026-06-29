import type { VerificationStatus } from "@prisma/client";

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  PENDING: "Verificação pendente",
  VERIFIED: "Verificado",
  REJECTED: "Verificação recusada",
};

export const VERIFICATION_DESCRIPTIONS: Record<VerificationStatus, string> = {
  PENDING:
    "Seu registro profissional está em análise. Você já pode usar a rede; o selo azul será liberado após aprovação.",
  VERIFIED:
    "Seu registro profissional foi confirmado pela equipe Doctor8. O selo azul aparece no seu perfil.",
  REJECTED:
    "Não foi possível confirmar seu registro. Corrija os dados ou envie um novo documento e solicite nova análise.",
};

export function formatRegistration(
  type: string | null | undefined,
  number: string | null | undefined,
  country: string | null | undefined
): string {
  const parts: string[] = [];
  if (type) parts.push(type);
  if (number) parts.push(number);
  if (country) parts.push(country);
  return parts.join(" · ") || "—";
}
