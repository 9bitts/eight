import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ListDetailClient } from "@/components/lists/ListDetailClient";
import { getListDetail } from "@/lib/lists";
import { getSessionUser, getUnreadNotificationCount } from "@/lib/feed";

type Props = { params: { id: string } };

export default async function ListDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const [list, notificationCount] = await Promise.all([
    getListDetail(params.id, user.profileId),
    getUnreadNotificationCount(user.profileId),
  ]);

  if (!list) notFound();

  return (
    <ListDetailClient user={user} notificationCount={notificationCount} list={list} />
  );
}
