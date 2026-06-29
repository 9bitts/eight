import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminCasesClient } from "@/components/admin/AdminCasesClient";
import { getClinicalCasesForAdmin } from "@/lib/actions/cases-admin";

export default async function AdminCasesPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/feed");

  const cases = await getClinicalCasesForAdmin();

  return <AdminCasesClient cases={cases} />;
}
