import { AdminReportsClient } from "@/components/admin/AdminReportsClient";
import { requireAdminPage } from "@/lib/admin";
import { getReportsForAdmin } from "@/lib/actions/reports";

export default async function AdminReportsPage() {
  await requireAdminPage();

  const reports = await getReportsForAdmin();

  return <AdminReportsClient reports={reports} />;
}
