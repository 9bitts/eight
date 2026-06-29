import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ListsClient } from "@/components/lists/ListsClient";
import { getMyLists } from "@/lib/lists";
import { getSessionUser, getUnreadNotificationCount } from "@/lib/feed";

export default async function ListsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const [lists, notificationCount] = await Promise.all([
    getMyLists(user.profileId),
    getUnreadNotificationCount(user.profileId),
  ]);

  return (
    <ListsClient user={user} notificationCount={notificationCount} lists={lists} />
  );
}
