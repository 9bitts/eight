import { AdminVerificationsClient } from "@/components/admin/AdminVerificationsClient";
import { requireAdminPage } from "@/lib/admin";
import { getPendingVerifications, getRecentVerificationReviews } from "@/lib/actions/admin";
import { resolveVerificationDocumentUrl } from "@/lib/verification-document";

export default async function AdminVerificationsPage() {
  await requireAdminPage();

  const [pendingRaw, recent] = await Promise.all([
    getPendingVerifications(),
    getRecentVerificationReviews(),
  ]);

  const pending = await Promise.all(
    pendingRaw.map(async (profile) => ({
      ...profile,
      verificationDocumentUrl: await resolveVerificationDocumentUrl(
        profile.verificationDocumentUrl,
        profile.id
      ),
    }))
  );

  return <AdminVerificationsClient pending={pending} recent={recent} />;
}
