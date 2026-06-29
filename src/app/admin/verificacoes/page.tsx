import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminVerificationsClient } from "@/components/admin/AdminVerificationsClient";
import { isAdminUser } from "@/lib/admin";
import { getPendingVerifications, getRecentVerificationReviews } from "@/lib/actions/admin";

export default async function AdminVerificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const isAdmin = await isAdminUser(session.user.id, session.user.email);
  if (!isAdmin) redirect("/feed");

  const [pending, recent] = await Promise.all([
    getPendingVerifications(),
    getRecentVerificationReviews(),
  ]);

  return <AdminVerificationsClient pending={pending} recent={recent} />;
}
