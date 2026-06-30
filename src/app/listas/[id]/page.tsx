import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { ListDetailClient } from "@/components/lists/ListDetailClient";
import { getListForViewer } from "@/lib/lists";
import { getPostsForList, getSessionUser, getUnreadNotificationCount } from "@/lib/feed";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const access = await getListForViewer(params.id);
  if (!access) {
    return { title: "Lista — eight" };
  }
  const { list } = access;
  if (!list.isPublic && !access.isOwner) {
    return { title: "Lista — eight" };
  }
  return {
    title: `${list.name} — eight`,
    description: list.description ?? `Lista de ${list.owner.displayName} no eight`,
    openGraph: {
      title: list.name,
      description: list.description ?? `Lista pública de @${list.owner.handle}`,
    },
  };
}

export default async function ListDetailPage({ params }: Props) {
  const session = await auth();
  const viewerProfileId = session?.user?.profileId;

  const access = await getListForViewer(params.id, viewerProfileId);
  if (!access) notFound();

  const user = session?.user?.id ? await getSessionUser(session.user.id) : null;
  if (session?.user?.id && !user) notFound();

  const [notificationCount, posts] = await Promise.all([
    user ? getUnreadNotificationCount(user.profileId) : Promise.resolve(0),
    getPostsForList(params.id, viewerProfileId),
  ]);

  return (
    <ListDetailClient
      user={user}
      notificationCount={notificationCount}
      list={access.list}
      posts={posts}
      isOwner={access.isOwner}
      isFollowing={access.isFollowing}
    />
  );
}
