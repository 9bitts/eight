import { AdminCasesClient } from "@/components/admin/AdminCasesClient";
import { requireAdminPage } from "@/lib/admin";
import { getClinicalCasesForAdmin } from "@/lib/actions/cases-admin";

export default async function AdminCasesPage() {
  await requireAdminPage();

  const cases = await getClinicalCasesForAdmin();

  return <AdminCasesClient cases={cases} />;
}
