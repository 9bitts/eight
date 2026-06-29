import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { PostEngagementClient } from "@/components/post/PostEngagementClient";
import { getPostById, getSessionUser, getUnreadNotificationCount } from "@/lib/feed";
import { getPostLikers } from "@/lib/relationships";

type Props = { params: { id: string } };

export default async function PostLikesPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const post = await getPostById(params.id, user.profileId);
  if (!post) notFound();

  const [connections, notificationCount] = await Promise.all([
    getPostLikers(params.id, user.profileId),
    getUnreadNotificationCount(user.profileId),
  ]);

  return (
    <PostEngagementClient
      user={user}
      notificationCount={notificationCount}
      postId={params.id}
      tab="curtidas"
      connections={connections}
    />
  );
}
