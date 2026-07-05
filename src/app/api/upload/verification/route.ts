import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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

  const profileId = session.user.profileId;

  const ip = clientIp(req);
  const limited = await rateLimit(`upload-verification:${profileId}:${ip}`, 10, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { verificationStatus: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
  }
  if (profile.verificationStatus === "VERIFIED") {
    return NextResponse.json({ error: "Seu perfil já está verificado." }, { status: 400 });
  }

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

  const key = await uploadPrivateVerificationFile(
    buffer,
    detected.ext,
    detected.mime,
    profileId
  );

  await prisma.profile.update({
    where: { id: profileId },
    data: {
      verificationDocumentUrl: key,
      verificationStatus: "PENDING",
      verificationSubmittedAt: new Date(),
      rejectionReason: null,
      verified: false,
      verifiedAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}
