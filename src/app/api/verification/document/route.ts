import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  getSignedDownloadUrl,
  isCloudStorageEnabled,
  readLocalVerificationFile,
} from "@/lib/storage";
import { assertSafeVerificationStorageKey } from "@/lib/verification-storage";

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

function notFound() {
  return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
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
    return notFound();
  }

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { verificationDocumentUrl: true },
  });
  const stored = profile?.verificationDocumentUrl;
  if (!stored) {
    return notFound();
  }

  let safeKey: string;
  try {
    safeKey = assertSafeVerificationStorageKey(stored, profileId);
  } catch {
    return notFound();
  }

  if (isCloudStorageEnabled()) {
    try {
      const signed = await getSignedDownloadUrl(safeKey, undefined, profileId);
      return NextResponse.redirect(signed);
    } catch {
      return notFound();
    }
  }

  try {
    const buffer = await readLocalVerificationFile(safeKey, profileId);
    const filename = safeKey.split("/").pop() ?? "documento";
    const contentType = contentTypeForFilename(filename);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return notFound();
  }
}
