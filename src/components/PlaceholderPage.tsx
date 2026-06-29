import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { FeedShell } from "@/components/feed/FeedShell";
import { getSessionUser, getUnreadNotificationCount } from "@/lib/feed";

const LINE = "#e4ebee";
const INK = "#0c2b36";

export default async function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup");
  const notificationCount = await getUnreadNotificationCount(user.profileId);

  return (
    <FeedShell user={user} notificationCount={notificationCount}>
      <main className="flex-1 min-w-0" style={{ maxWidth: 620, background: "#fff", borderRight: `1px solid ${LINE}` }}>
        <div className="px-4 py-12 text-center">
          <h1 style={{ fontWeight: 800, fontSize: 22, color: INK }}>{title}</h1>
          <p style={{ color: "#7a8f97", marginTop: 12, lineHeight: 1.5 }}>{description}</p>
          <Link href="/feed" style={{ color: "#176a88", fontWeight: 600, display: "inline-block", marginTop: 20 }}>
            ← Voltar ao início
          </Link>
        </div>
      </main>
    </FeedShell>
  );
}
