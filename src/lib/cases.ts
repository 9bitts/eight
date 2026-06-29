const CPF_RE = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/;
const PHONE_RE = /\b(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}\b/;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

const BLOCKED_PATTERNS: { re: RegExp; msg: string }[] = [
  { re: CPF_RE, msg: "Remova CPF ou documentos identificáveis do caso." },
  { re: PHONE_RE, msg: "Remova telefones do relato do caso." },
  { re: EMAIL_RE, msg: "Remova e-mails do relato do caso." },
  {
    re: /\b(paciente|sr\.|sra\.|senhor|senhora)\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+/i,
    msg: "Evite nomes de pacientes. Use termos como “paciente do sexo masculino, 45 anos”.",
  },
];

export function validateClinicalCaseBody(body: string): string | null {
  const text = body.trim();
  if (!text) return "Descreva o caso clínico.";
  if (text.length < 30) return "Descreva o caso com mais detalhes (mínimo 30 caracteres).";
  if (text.length > 500) return "Máximo 500 caracteres.";

  for (const { re, msg } of BLOCKED_PATTERNS) {
    if (re.test(text)) return msg;
  }
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
