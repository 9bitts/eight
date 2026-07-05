import path from "path";
import { randomUUID } from "crypto";

/** Diretório base local para documentos de verificação (fora de public/). */
export const LOCAL_VERIFICATION_DIR = path.join(process.cwd(), "data", "verification");

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "pdf"]);

/** Chave gerada exclusivamente no servidor: verification/{ownerId}/{uuid}.{ext} */
export function buildVerificationStorageKey(ownerProfileId: string, ext: string): string {
  const safeOwner = ownerProfileId.trim();
  if (!/^[a-zA-Z0-9_-]+$/.test(safeOwner)) {
    throw new Error("Perfil inválido.");
  }
  const normalizedExt = ext.toLowerCase().replace(/^\./, "");
  if (!ALLOWED_EXT.has(normalizedExt)) {
    throw new Error("Extensão inválida.");
  }
  return `verification/${safeOwner}/${randomUUID()}.${normalizedExt}`;
}

/** Formato legado (pré-refactor): verification/{uuid}.{ext} — somente leitura. */
const LEGACY_KEY_RE =
  /^verification\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.(jpg|jpeg|png|webp|pdf)$/i;

const SCOPED_KEY_RE =
  /^verification\/([a-zA-Z0-9_-]+)\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.(jpg|jpeg|png|webp|pdf)$/i;

/**
 * Valida chave de storage antes de ler/assinar. Rejeita .., caminhos absolutos e URLs.
 * Se expectedProfileId for informado, exige que a chave pertença a esse perfil (formato novo).
 */
export function assertSafeVerificationStorageKey(
  key: string,
  expectedProfileId?: string
): string {
  const trimmed = key.trim();
  if (!trimmed) throw new Error("Documento inválido.");
  if (
    trimmed.includes("..") ||
    trimmed.includes("\\") ||
    trimmed.startsWith("/") ||
    /^https?:/i.test(trimmed) ||
    path.isAbsolute(trimmed)
  ) {
    throw new Error("Documento inválido.");
  }

  if (LEGACY_KEY_RE.test(trimmed)) {
    return trimmed;
  }

  const match = SCOPED_KEY_RE.exec(trimmed);
  if (!match) throw new Error("Documento inválido.");

  if (expectedProfileId && match[1] !== expectedProfileId) {
    throw new Error("Documento inválido.");
  }

  return trimmed;
}

function assertResolvedPathUnderBase(resolvedPath: string, baseDir: string): void {
  const base = path.resolve(baseDir);
  const resolved = path.resolve(resolvedPath);
  const baseWithSep = base.endsWith(path.sep) ? base : base + path.sep;
  if (resolved !== base && !resolved.startsWith(baseWithSep)) {
    throw new Error("Documento inválido.");
  }
}

/** Resolve caminho absoluto no disco com defesa em profundidade contra path traversal. */
export function resolveLocalVerificationFilePath(storageKey: string): string {
  const key = assertSafeVerificationStorageKey(storageKey);
  const relative = key.startsWith("verification/")
    ? key.slice("verification/".length)
    : key;
  const full = path.resolve(LOCAL_VERIFICATION_DIR, relative);
  assertResolvedPathUnderBase(full, LOCAL_VERIFICATION_DIR);
  return full;
}
