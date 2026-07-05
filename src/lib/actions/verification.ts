"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireProfile() {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) throw new Error("Não autorizado");
  return profileId;
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
