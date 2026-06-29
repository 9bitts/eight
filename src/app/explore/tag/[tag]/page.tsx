import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { FeedShell } from "@/components/feed/FeedShell";
import { PostCard } from "@/components/feed/PostCard";
import {
  getPostsByHashtag,
  getSessionUser,
  getUnreadNotificationCount,
  formatCount,
} from "@/lib/feed";

const LINE = "var(--eight-line)";
const INK = "var(--eight-ink)";
const MUTED = "var(--eight-muted)";
const CARD = "var(--eight-card-bg)";

type Props = { params: { tag: string } };

export default async function HashtagPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const tag = decodeURIComponent(params.tag).toLowerCase();
  const [posts, notificationCount] = await Promise.all([
    getPostsByHashtag(tag, user.profileId),
    getUnreadNotificationCount(user.profileId),
  ]);

  return (
    <FeedShell user={user} notificationCount={notificationCount}>
      <main className="flex-1 min-w-0" style={{ maxWidth: 620, background: CARD, borderRight: `1px solid ${LINE}` }}>
        <div className="sticky top-0 z-10 px-4 py-3" style={{ borderBottom: `1px solid ${LINE}`, background: "var(--eight-header-bg)" }}>
          <Link href="/feed" style={{ fontSize: 13, color: "#176a88" }}>← Início</Link>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: INK }}>#{tag}</h1>
          <p style={{ color: MUTED, fontSize: 13 }}>
            {formatCount(posts.length)} publicação{posts.length !== 1 ? "ões" : ""}
          </p>
        </div>
        {posts.length === 0 ? (
          <p className="px-4 py-12 text-center" style={{ color: "#7a8f97" }}>
            Nenhuma publicação com #{tag} ainda.
          </p>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </main>
    </FeedShell>
  );
}
