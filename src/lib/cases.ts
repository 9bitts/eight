import { detectPII } from "@/lib/pii-detector";
import { prisma } from "@/lib/prisma";

/** Bloqueia CPF, telefone, e-mail e nomes de paciente — sem exigir tamanho mínimo. */
export function detectClinicalCaseViolations(body: string): string | null {
  const text = body.trim();
  if (!text) return null;

  const pii = detectPII(text);
  if (pii.blocked) return pii.reason ?? "Remova dados identificáveis do caso.";
  return null;
}

export function validateClinicalCaseBody(body: string): string | null {
  const text = body.trim();
  if (!text) return "Descreva o caso clínico.";
  if (text.length < 30) return "Descreva o caso com mais detalhes (mínimo 30 caracteres).";
  if (text.length > 500) return "Máximo 500 caracteres.";

  return detectClinicalCaseViolations(text);
}

/** Sobe a cadeia parentId até achar um post com isClinicalCase (raiz do caso). */
export async function isInClinicalCaseThread(
  ancestorPostId: string | null | undefined
): Promise<boolean> {
  if (!ancestorPostId?.trim()) return false;

  let currentId: string | null = ancestorPostId.trim();
  const seen = new Set<string>();

  while (currentId && !seen.has(currentId)) {
    seen.add(currentId);
    const post: { isClinicalCase: boolean; parentId: string | null } | null =
      await prisma.post.findUnique({
        where: { id: currentId },
        select: { isClinicalCase: true, parentId: true },
      });
    if (!post) return false;
    if (post.isClinicalCase) return true;
    currentId = post.parentId;
  }

  return false;
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
