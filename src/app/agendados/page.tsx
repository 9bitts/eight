import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ScheduledClient } from "@/components/feed/ScheduledClient";
import { getScheduledPosts, getSessionUser, getUnreadNotificationCount } from "@/lib/feed";

export default async function ScheduledPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const [posts, notificationCount] = await Promise.all([
    getScheduledPosts(user.profileId),
    getUnreadNotificationCount(user.profileId),
  ]);

  return (
    <ScheduledClient user={user} notificationCount={notificationCount} posts={posts} />
  );
}
