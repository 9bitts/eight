import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminReportsClient } from "@/components/admin/AdminReportsClient";
import { getReportsForAdmin } from "@/lib/actions/reports";
import { getSessionUser } from "@/lib/feed";

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user?.isAdmin) redirect("/feed");

  const reports = await getReportsForAdmin();

  return <AdminReportsClient reports={reports} />;
}
