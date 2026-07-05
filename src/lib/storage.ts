import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { writeFile, mkdir, readFile, readdir, stat } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { LOCAL_UPLOADS_MAX_BYTES } from "@/lib/constants";
import { extensionForMime } from "@/lib/mime-ext";
import {
  LOCAL_VERIFICATION_DIR,
  assertSafeVerificationStorageKey,
  buildVerificationStorageKey,
  resolveLocalVerificationFilePath,
} from "@/lib/verification-storage";

const VERIFICATION_SIGNED_URL_TTL_SEC = 15 * 60;

function s3Configured() {
  return !!(
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_ENDPOINT
  );
}

function getS3Client() {
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}

export function isCloudStorageEnabled() {
  return s3Configured();
}

async function getDirectorySize(dir: string): Promise<number> {
  let total = 0;
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        total += await getDirectorySize(full);
      } else if (entry.isFile()) {
        const info = await stat(full);
        total += info.size;
      }
    }
  } catch {
    /* diretório inexistente */
  }
  return total;
}

async function assertLocalUploadQuota(additionalBytes: number) {
  const dir = path.join(process.cwd(), "public", "uploads");
  const current = await getDirectorySize(dir);
  if (current + additionalBytes > LOCAL_UPLOADS_MAX_BYTES) {
    throw new Error("Cota de armazenamento local esgotada.");
  }
}

export { extensionForMime };

/** Extrai a chave S3 (ou caminho local) de um valor legado em URL completa. */
export function parseStorageKey(stored: string): string {
  const value = stored.trim();
  if (!value) return value;
  if (!value.startsWith("http") && !value.startsWith("/")) return value;

  if (value.startsWith("/")) {
    return value.replace(/^\/+/, "");
  }

  try {
    const pathname = new URL(value).pathname.replace(/^\/+/, "");
    const bucket = process.env.S3_BUCKET;
    if (bucket && pathname.startsWith(`${bucket}/`)) {
      return pathname.slice(bucket.length + 1);
    }
    const uploadsIdx = pathname.indexOf("uploads/");
    if (uploadsIdx >= 0) return pathname.slice(uploadsIdx);
    const verificationIdx = pathname.indexOf("verification/");
    if (verificationIdx >= 0) return pathname.slice(verificationIdx);
    return pathname;
  } catch {
    return value;
  }
}

export async function getSignedDownloadUrl(
  keyOrStored: string,
  expiresInSec = VERIFICATION_SIGNED_URL_TTL_SEC,
  expectedProfileId?: string
): Promise<string> {
  if (!s3Configured()) {
    throw new Error("S3 não configurado");
  }
  const key = parseStorageKey(keyOrStored);
  if (key.startsWith("verification/")) {
    assertSafeVerificationStorageKey(key, expectedProfileId);
  }
  const client = getS3Client();
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
    }),
    { expiresIn: expiresInSec }
  );
}

export function localVerificationFilePath(keyOrStored: string, expectedProfileId?: string): string {
  const key = parseStorageKey(keyOrStored);
  assertSafeVerificationStorageKey(key, expectedProfileId);
  return resolveLocalVerificationFilePath(key);
}

export async function readLocalVerificationFile(
  keyOrStored: string,
  expectedProfileId?: string
): Promise<Buffer> {
  return readFile(localVerificationFilePath(keyOrStored, expectedProfileId));
}

export async function uploadFile(
  buffer: Buffer,
  ext: string,
  contentType: string
): Promise<string> {
  const safeExt = extensionForMime(contentType) !== "bin" ? extensionForMime(contentType) : ext;
  const filename = `${randomUUID()}.${safeExt}`;

  if (s3Configured()) {
    const client = getS3Client();
    const key = `uploads/${filename}`;
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    // S3_PUBLIC_URL: apenas uploads públicos (avatares, mídia de posts).
    // Documentos de verificação usam uploadPrivateVerificationFile + URL assinada.
    const publicBase = process.env.S3_PUBLIC_URL?.replace(/\/$/, "");
    if (publicBase) return `${publicBase}/${key}`;
    return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Storage de objeto não configurado em produção");
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await assertLocalUploadQuota(buffer.length);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${filename}`;
}

/** Upload privado para documentos de verificação — retorna chave, não URL pública. */
export async function uploadPrivateVerificationFile(
  buffer: Buffer,
  ext: string,
  contentType: string,
  ownerProfileId: string
): Promise<string> {
  const key = buildVerificationStorageKey(
    ownerProfileId,
    extensionForMime(contentType) !== "bin" ? extensionForMime(contentType) : ext
  );

  if (s3Configured()) {
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return key;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Storage de objeto não configurado em produção");
  }

  const relative = key.slice("verification/".length);
  const dir = path.dirname(path.join(LOCAL_VERIFICATION_DIR, relative));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(LOCAL_VERIFICATION_DIR, relative), buffer);
  return key;
}
