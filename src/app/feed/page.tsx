import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FeedClient } from "@/components/feed/FeedClient";
import {
  getFeedPosts,
  getSessionUser,
  getSuggestions,
  getUnreadNotificationCount,
} from "@/lib/feed";

export default async function FeedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup");

  const [posts, suggestions, notificationCount] = await Promise.all([
    getFeedPosts(user.profileId),
    getSuggestions(user.profileId),
    getUnreadNotificationCount(user.profileId),
  ]);

  return (
    <FeedClient
      user={user}
      initialPosts={posts}
      initialSuggestions={suggestions}
      notificationCount={notificationCount}
    />
  );
}
