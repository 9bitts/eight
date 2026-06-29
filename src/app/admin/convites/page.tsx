import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminInvitesClient } from "@/components/admin/AdminInvitesClient";
import { isAdminUser } from "@/lib/admin";
import { getAdminInvites } from "@/lib/actions/invites";
import { isEmailConfigured } from "@/lib/email";

export default async function AdminInvitesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const isAdmin = await isAdminUser(session.user.id, session.user.email);
  if (!isAdmin) redirect("/feed");

  const invites = await getAdminInvites();

  return (
    <AdminInvitesClient
      invites={invites}
      emailConfigured={isEmailConfigured()}
    />
  );
}
