import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { PostThreadClient } from "@/components/post/PostThreadClient";
import {
  getPostById,
  getReplies,
  getSessionUser,
  getUnreadNotificationCount,
} from "@/lib/feed";

type Props = { params: { id: string } };

export default async function PostPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup");

  const post = await getPostById(params.id, user.profileId);
  if (!post) notFound();

  const [replies, notificationCount] = await Promise.all([
    getReplies(params.id, user.profileId),
    getUnreadNotificationCount(user.profileId),
  ]);

  return (
    <PostThreadClient
      post={post}
      replies={replies}
      user={user}
      notificationCount={notificationCount}
    />
  );
}
