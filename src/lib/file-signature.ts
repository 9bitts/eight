/** MIME detectado exclusivamente pela assinatura (magic bytes) do arquivo. */
export type DetectedFileMime =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp"
  | "video/mp4"
  | "video/webm"
  | "application/pdf";

export type FileSignatureMatch = {
  mime: DetectedFileMime;
  ext: string;
};

function startsWith(buf: Buffer, sig: number[], offset = 0): boolean {
  if (buf.length < offset + sig.length) return false;
  return sig.every((byte, i) => buf[offset + i] === byte);
}

/** Detecta o tipo real pelo conteúdo; ignora MIME/extensão declarados pelo cliente. */
export function detectFileSignature(buffer: Buffer): FileSignatureMatch | null {
  if (buffer.length < 4) return null;

  if (startsWith(buffer, [0x25, 0x50, 0x44, 0x46])) {
    return { mime: "application/pdf", ext: "pdf" };
  }

  if (startsWith(buffer, [0xff, 0xd8, 0xff])) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: "image/png", ext: "png" };
  }

  if (startsWith(buffer, [0x47, 0x49, 0x46, 0x38])) {
    return { mime: "image/gif", ext: "gif" };
  }

  if (
    startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    buffer.length >= 12 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }

  if (startsWith(buffer, [0x1a, 0x45, 0xdf, 0xa3])) {
    return { mime: "video/webm", ext: "webm" };
  }

  if (
    buffer.length >= 12 &&
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    return { mime: "video/mp4", ext: "mp4" };
  }

  return null;
}

export const PUBLIC_UPLOAD_MIMES: ReadonlySet<DetectedFileMime> = new Set<DetectedFileMime>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);

export const VERIFICATION_UPLOAD_MIMES: ReadonlySet<DetectedFileMime> = new Set<DetectedFileMime>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export function validateFileSignature(
  buffer: Buffer,
  allowed: ReadonlySet<DetectedFileMime>
): FileSignatureMatch | null {
  const detected = detectFileSignature(buffer);
  if (!detected || !allowed.has(detected.mime)) return null;
  return detected;
}
