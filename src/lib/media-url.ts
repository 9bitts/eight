import { parseStorageKey } from "@/lib/storage";
import { resolveSiteUrl } from "@/lib/site-url";

function trustedMediaOrigins(): Set<string> {
  const origins = new Set<string>();
  for (const raw of [
    process.env.S3_PUBLIC_URL,
    process.env.S3_ENDPOINT,
    resolveSiteUrl(),
  ]) {
    if (!raw?.trim()) continue;
    try {
      origins.add(new URL(raw.trim().replace(/\/$/, "")).origin);
    } catch {
      /* ignorar env inválida */
    }
  }
  return origins;
}

function s3EndpointOrigin(): string | null {
  const raw = process.env.S3_ENDPOINT?.trim();
  if (!raw) return null;
  try {
    return new URL(raw.replace(/\/$/, "")).origin;
  } catch {
    return null;
  }
}

/** Endpoint S3 path-style: /{bucket}/uploads/... — bucket deve ser o nosso. */
function isAllowedS3EndpointPath(parsed: URL): boolean {
  const bucket = process.env.S3_BUCKET?.trim();
  if (!bucket) return false;
  const pathname = parsed.pathname.replace(/^\/+/, "");
  return pathname.startsWith(`${bucket}/uploads/`);
}

function isUploadsStorageKey(key: string): boolean {
  return key.startsWith("uploads/") && !key.includes("..");
}

/** URL pública de mídia gerada pelo pipeline de upload da plataforma. */
export function isAllowedMediaUrl(url: string | null | undefined): boolean {
  if (url == null || url.trim() === "") return true;

  const trimmed = url.trim();
  if (trimmed.includes("..") || trimmed.includes("\\")) return false;

  // Protocol-relative (//host/...) — rejeitar explicitamente (new URL falha sem base).
  if (trimmed.startsWith("//")) return false;

  if (trimmed.startsWith("/uploads/")) {
    return isUploadsStorageKey(trimmed.replace(/^\/+/, ""));
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") return false;
  if (parsed.username || parsed.password) return false;
  if (!trustedMediaOrigins().has(parsed.origin)) return false;

  const endpointOrigin = s3EndpointOrigin();
  if (endpointOrigin && parsed.origin === endpointOrigin) {
    if (!isAllowedS3EndpointPath(parsed)) return false;
  }

  const key = parseStorageKey(trimmed);
  return isUploadsStorageKey(key);
}

export function assertAllowedPostMedia(data: {
  images?: string[];
  videoUrl?: string | null;
  gifUrl?: string | null;
}): void {
  for (const img of data.images ?? []) {
    if (!isAllowedMediaUrl(img)) {
      throw new Error("Use apenas imagens enviadas pela plataforma.");
    }
  }
  if (data.videoUrl?.trim() && !isAllowedMediaUrl(data.videoUrl)) {
    throw new Error("Use apenas vídeos enviados pela plataforma.");
  }
  if (data.gifUrl?.trim() && !isAllowedMediaUrl(data.gifUrl)) {
    throw new Error("Use apenas GIFs enviados pela plataforma.");
  }
}

export function assertAllowedProfileMedia(data: {
  avatarUrl?: string | null;
  bannerUrl?: string | null;
}): void {
  if (data.avatarUrl?.trim() && !isAllowedMediaUrl(data.avatarUrl)) {
    throw new Error("Use apenas imagens enviadas pela plataforma.");
  }
  if (data.bannerUrl?.trim() && !isAllowedMediaUrl(data.bannerUrl)) {
    throw new Error("Use apenas imagens enviadas pela plataforma.");
  }
}

/** Espelha uploadFile() local/S3 para testes de fluxo ponta a ponta. */
export function buildPublicUploadUrl(filename: string): string {
  const publicBase = process.env.S3_PUBLIC_URL?.replace(/\/$/, "");
  if (publicBase) {
    return `${publicBase}/uploads/${filename}`;
  }
  if (
    process.env.S3_BUCKET &&
    process.env.S3_ENDPOINT
  ) {
    const endpoint = process.env.S3_ENDPOINT.replace(/\/$/, "");
    return `${endpoint}/${process.env.S3_BUCKET}/uploads/${filename}`;
  }
  return `/uploads/${filename}`;
}
