import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  getSignedDownloadUrl,
  isCloudStorageEnabled,
  localVerificationFilePath,
  parseStorageKey,
  readLocalVerificationFile,
} from "@/lib/storage";

function contentTypeForFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.profileId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const profileId =
    new URL(req.url).searchParams.get("profileId")?.trim() || session.user.profileId;

  const isOwner = profileId === session.user.profileId;
  const isAdmin = await isAdminUser(session.user.id, session.user.email);
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { verificationDocumentUrl: true },
  });
  const stored = profile?.verificationDocumentUrl;
  if (!stored) {
    return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
  }

  if (isCloudStorageEnabled()) {
    const signed = await getSignedDownloadUrl(parseStorageKey(stored));
    return NextResponse.redirect(signed);
  }

  if (stored.startsWith("/")) {
    return NextResponse.redirect(new URL(stored, req.url));
  }

  try {
    const buffer = await readLocalVerificationFile(stored);
    const filename = parseStorageKey(stored).split("/").pop() ?? "documento";
    const contentType = contentTypeForFilename(filename);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    const legacyPath = localVerificationFilePath(stored);
    return NextResponse.json(
      { error: `Arquivo não encontrado (${legacyPath})` },
      { status: 404 }
    );
  }
}
