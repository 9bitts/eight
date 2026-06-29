import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSessionUser } from "@/lib/feed";
import { normalizeHandle } from "@/lib/validators";
import { CompleteSignupClient } from "./CompleteSignupClient";

export default async function CompleteSignupPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (user) redirect("/feed");

  const displayName = session.user.name?.trim() || "Profissional";
  const raw = session.user.name?.trim().toLowerCase().replace(/[^a-z0-9]/g, "") ?? "profissional";
  const suggestedHandle = normalizeHandle(raw).slice(0, 15) || "profissional";

  return (
    <CompleteSignupClient
      displayName={displayName}
      suggestedHandle={suggestedHandle}
    />
  );
}
