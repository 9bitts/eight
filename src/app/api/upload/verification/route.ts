import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadPrivateVerificationFile } from "@/lib/storage";
import {
  VERIFICATION_UPLOAD_MIMES,
  validateFileSignature,
} from "@/lib/file-signature";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const MAX_DOC = 10 * 1024 * 1024;

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

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = validateFileSignature(buffer, VERIFICATION_UPLOAD_MIMES);
  if (!detected) {
    return NextResponse.json(
      { error: "Envie imagem (JPG, PNG, WebP) ou PDF válidos." },
      { status: 400 }
    );
  }

  if (file.size > MAX_DOC) {
    return NextResponse.json({ error: "Arquivo muito grande (máx. 10 MB)." }, { status: 400 });
  }

  const key = await uploadPrivateVerificationFile(buffer, detected.ext, detected.mime);

  return NextResponse.json({ key });
}
