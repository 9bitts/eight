import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadFile } from "@/lib/storage";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;
const MAX_GIF = 10 * 1024 * 1024;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const GIF_TYPES = ["image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.profileId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const ip = clientIp(req);
  const limited = rateLimit(`upload:${session.user.profileId}:${ip}`, 30, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });

  const isGif = GIF_TYPES.includes(file.type);
  const isImage = IMAGE_TYPES.includes(file.type);
  const isVideo = VIDEO_TYPES.includes(file.type);

  if (!isGif && !isImage && !isVideo) {
    return NextResponse.json({ error: "Tipo não suportado" }, { status: 400 });
  }

  const max = isVideo ? MAX_VIDEO : isGif ? MAX_GIF : MAX_IMAGE;
  if (file.size > max) {
    return NextResponse.json({ error: "Arquivo muito grande" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadFile(buffer, ext, file.type);

  return NextResponse.json({
    url,
    type: isVideo ? "video" : isGif ? "gif" : "image",
  });
}
