"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateClinicalCaseBody } from "@/lib/cases";
import { syncHashtags } from "@/lib/post-server";

async function requireVerifiedProfile() {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) throw new Error("Não autorizado");

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { verified: true, specialty: true },
  });
  if (!profile?.verified) {
    throw new Error("Casos clínicos são exclusivos para profissionais verificados.");
  }
  return { profileId, specialty: profile.specialty };
}

export async function createClinicalCase(input: {
  body: string;
  tags: string[];
  specialty?: string;
  confirmedAnonymized: boolean;
}) {
  const { profileId, specialty: profileSpecialty } = await requireVerifiedProfile();

  if (!input.confirmedAnonymized) {
    throw new Error("Confirme que o caso está anonimizado e sem dados identificáveis.");
  }

  const error = validateClinicalCaseBody(input.body);
  if (error) throw new Error(error);

  const tags = input.tags.map((t) => t.trim()).filter(Boolean).slice(0, 5);
  const caseSpecialty = (input.specialty?.trim() || profileSpecialty || "").slice(0, 80);

  const post = await prisma.post.create({
    data: {
      authorId: profileId,
      body: input.body.trim(),
      isClinicalCase: true,
      caseTags: tags,
      caseSpecialty: caseSpecialty || null,
    },
  });

  await syncHashtags(post.id, input.body);

  revalidatePath("/cases");
  revalidatePath("/feed");
  return { id: post.id };
}
