import { AdminInvitesClient } from "@/components/admin/AdminInvitesClient";
import { requireAdminPage } from "@/lib/admin";
import { getAdminInvites } from "@/lib/actions/invites";
import { isEmailConfigured } from "@/lib/email";

export default async function AdminInvitesPage() {
  await requireAdminPage();

  const invites = await getAdminInvites();

  return (
    <AdminInvitesClient
      invites={invites}
      emailConfigured={isEmailConfigured()}
    />
  );
}
