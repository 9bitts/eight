import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadFile } from "@/lib/storage";
import {
  PUBLIC_UPLOAD_MIMES,
  validateFileSignature,
  type DetectedFileMime,
} from "@/lib/file-signature";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;
const MAX_GIF = 10 * 1024 * 1024;

function maxBytesForMime(mime: DetectedFileMime): number {
  if (mime === "video/mp4" || mime === "video/webm") return MAX_VIDEO;
  if (mime === "image/gif") return MAX_GIF;
  return MAX_IMAGE;
}

function responseType(mime: DetectedFileMime): "video" | "gif" | "image" {
  if (mime === "video/mp4" || mime === "video/webm") return "video";
  if (mime === "image/gif") return "gif";
  return "image";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.profileId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const ip = clientIp(req);
  const limited = await rateLimit(`upload:${session.user.profileId}:${ip}`, 30, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = validateFileSignature(buffer, PUBLIC_UPLOAD_MIMES);
  if (!detected) {
    return NextResponse.json(
      { error: "Tipo de arquivo não suportado ou conteúdo inválido." },
      { status: 400 }
    );
  }

  const max = maxBytesForMime(detected.mime);
  if (file.size > max) {
    return NextResponse.json({ error: "Arquivo muito grande" }, { status: 400 });
  }

  let url: string;
  try {
    url = await uploadFile(buffer, detected.ext, detected.mime);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha no upload";
    if (message.includes("Cota")) {
      return NextResponse.json({ error: message }, { status: 507 });
    }
    throw err;
  }

  return NextResponse.json({
    url,
    type: responseType(detected.mime),
  });
}
