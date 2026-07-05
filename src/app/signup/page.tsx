import { redirect } from "next/navigation";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { invite?: string };
}) {
  const invite = searchParams.invite?.trim();
  redirect(invite ? `/login?invite=${encodeURIComponent(invite)}` : "/login");
}
