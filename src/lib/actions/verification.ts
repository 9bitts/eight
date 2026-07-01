"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseStorageKey } from "@/lib/storage";

async function requireProfile() {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) throw new Error("Não autorizado");
  return profileId;
}

export async function submitVerificationDocument(documentKey: string) {
  const profileId = await requireProfile();
  const key = parseStorageKey(documentKey.trim());
  if (!key) throw new Error("Envie um documento.");

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { verificationStatus: true },
  });
  if (!profile) throw new Error("Perfil não encontrado");
  if (profile.verificationStatus === "VERIFIED") {
    throw new Error("Seu perfil já está verificado.");
  }

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

  revalidatePath("/verificacao");
  revalidatePath("/admin/verificacoes");
  revalidatePath("/feed");
}

export async function updateRegistrationInfo(data: {
  specialty: string;
  registrationType: string;
  registrationNumber: string;
  registrationCountry: string;
}) {
  const profileId = await requireProfile();

  const specialty = data.specialty.trim();
  const registrationType = data.registrationType.trim();
  const registrationNumber = data.registrationNumber.trim();
  const registrationCountry = data.registrationCountry.trim();

  if (!specialty || !registrationType || !registrationNumber) {
    throw new Error("Preencha todos os campos do registro.");
  }

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { verificationStatus: true },
  });
  if (profile?.verificationStatus === "VERIFIED") {
    throw new Error("Perfil verificado — contate o suporte para alterar o registro.");
  }

  await prisma.profile.update({
    where: { id: profileId },
    data: {
      specialty,
      registrationType,
      registrationNumber,
      registrationCountry: registrationCountry || null,
      verificationStatus: "PENDING",
      verificationSubmittedAt: new Date(),
      verified: false,
      verifiedAt: null,
    },
  });

  revalidatePath("/verificacao");
  revalidatePath("/admin/verificacoes");
}
