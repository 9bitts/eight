import { detectPII } from "@/lib/pii-detector";

export function validateClinicalCaseBody(body: string): string | null {
  const text = body.trim();
  if (!text) return "Descreva o caso clínico.";
  if (text.length < 30) return "Descreva o caso com mais detalhes (mínimo 30 caracteres).";
  if (text.length > 500) return "Máximo 500 caracteres.";

  const pii = detectPII(text);
  if (pii.blocked) return pii.reason ?? "Remova dados identificáveis do caso.";
  return null;
}

export const CASE_TAG_OPTIONS = [
  "Urgência",
  "Diagnóstico diferencial",
  "Conduta",
  "Telemedicina",
  "Pediatria",
  "Geriatria",
  "Cirurgia",
  "Exames",
];
