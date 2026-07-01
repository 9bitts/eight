import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadPrivateVerificationFile, extensionForMime } from "@/lib/storage";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const MAX_DOC = 10 * 1024 * 1024;
const DOC_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.profileId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const ip = clientIp(req);
  const limited = await rateLimit(`upload-verification:${session.user.profileId}:${ip}`, 10, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });

  if (!DOC_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Envie imagem (JPG, PNG, WebP) ou PDF." }, { status: 400 });
  }
  if (file.size > MAX_DOC) {
    return NextResponse.json({ error: "Arquivo muito grande (máx. 10 MB)." }, { status: 400 });
  }

  const ext = extensionForMime(file.type);
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = await uploadPrivateVerificationFile(buffer, ext, file.type);

  return NextResponse.json({ key });
}
