import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { VerificationClient } from "@/components/verification/VerificationClient";
import { getSessionUser } from "@/lib/feed";
import { prisma } from "@/lib/prisma";
import { resolveVerificationDocumentUrl } from "@/lib/verification-document";

export default async function VerificationPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const profile = await prisma.profile.findUnique({
    where: { id: user.profileId },
    select: {
      displayName: true,
      handle: true,
      specialty: true,
      registrationType: true,
      registrationNumber: true,
      registrationCountry: true,
      verificationStatus: true,
      verificationDocumentUrl: true,
      rejectionReason: true,
      verified: true,
    },
  });
  if (!profile) redirect("/signup/complete");

  const verificationDocumentUrl = await resolveVerificationDocumentUrl(
    profile.verificationDocumentUrl,
    user.profileId
  );

  return (
    <VerificationClient
      profile={{
        displayName: profile.displayName,
        handle: profile.handle,
        specialty: profile.specialty ?? "",
        registrationType: profile.registrationType ?? "",
        registrationNumber: profile.registrationNumber ?? "",
        registrationCountry: profile.registrationCountry ?? "",
        verificationStatus: profile.verificationStatus,
        verificationDocumentUrl,
        rejectionReason: profile.rejectionReason,
        verified: profile.verified,
      }}
    />
  );
}
