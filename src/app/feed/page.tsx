import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FeedClient } from "@/components/feed/FeedClient";
import {
  getFeedPosts,
  getSessionUser,
  getSuggestions,
  getTrendingHashtags,
  getUnreadNotificationCount,
} from "@/lib/feed";
import type { FeedTab } from "@/lib/types";

type Props = { searchParams: { tab?: string } };

export default async function FeedPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const tab: FeedTab = searchParams.tab === "following" ? "following" : "forYou";

  const [posts, suggestions, trends, notificationCount] = await Promise.all([
    getFeedPosts(user.profileId, tab),
    getSuggestions(user.profileId),
    getTrendingHashtags(),
    getUnreadNotificationCount(user.profileId),
  ]);

  return (
    <FeedClient
      user={user}
      initialPosts={posts}
      initialSuggestions={suggestions}
      trends={trends}
      notificationCount={notificationCount}
      tab={tab}
    />
  );
}
