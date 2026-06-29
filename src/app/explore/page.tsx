import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ExploreClient } from "@/components/explore/ExploreClient";
import { getSessionUser, getUnreadNotificationCount } from "@/lib/feed";

export default async function ExplorePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup");

  const notificationCount = await getUnreadNotificationCount(user.profileId);

  return <ExploreClient user={user} notificationCount={notificationCount} />;
}
