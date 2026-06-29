import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SavedClient } from "@/components/feed/SavedClient";
import { getSavedPosts, getSessionUser, getUnreadNotificationCount } from "@/lib/feed";

export default async function SavedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const [posts, notificationCount] = await Promise.all([
    getSavedPosts(user.profileId),
    getUnreadNotificationCount(user.profileId),
  ]);

  return <SavedClient user={user} notificationCount={notificationCount} posts={posts} />;
}
