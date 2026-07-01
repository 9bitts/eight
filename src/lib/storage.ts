import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

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
  expiresInSec = VERIFICATION_SIGNED_URL_TTL_SEC
): Promise<string> {
  if (!s3Configured()) {
    throw new Error("S3 não configurado");
  }
  const key = parseStorageKey(keyOrStored);
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

export function localVerificationFilePath(keyOrStored: string): string {
  const key = parseStorageKey(keyOrStored);
  const relative = key.startsWith("verification/") ? key.slice("verification/".length) : key;
  return path.join(process.cwd(), "data", "verification", relative);
}

export async function readLocalVerificationFile(keyOrStored: string): Promise<Buffer> {
  return readFile(localVerificationFilePath(keyOrStored));
}

export async function uploadFile(
  buffer: Buffer,
  ext: string,
  contentType: string
): Promise<string> {
  const filename = `${randomUUID()}.${ext}`;

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
    const publicBase = process.env.S3_PUBLIC_URL?.replace(/\/$/, "");
    if (publicBase) return `${publicBase}/${key}`;
    return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${filename}`;
}

/** Upload privado para documentos de verificação — retorna chave, não URL pública. */
export async function uploadPrivateVerificationFile(
  buffer: Buffer,
  ext: string,
  contentType: string
): Promise<string> {
  const filename = `${randomUUID()}.${ext}`;
  const key = `verification/${filename}`;

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

  const dir = path.join(process.cwd(), "data", "verification");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return key;
}
