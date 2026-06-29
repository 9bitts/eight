import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { PostThreadClient } from "@/components/post/PostThreadClient";
import {
  getPostById,
  getReplies,
  getThreadPosts,
  getSessionUser,
  getUnreadNotificationCount,
} from "@/lib/feed";
import { buildPostMetadata } from "@/lib/metadata";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return buildPostMetadata(params.id);
}

export default async function PostPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const post = await getPostById(params.id, user.profileId);
  if (!post) notFound();

  const threadRootId = post.threadId ?? post.id;

  const [threadPosts, replies, notificationCount] = await Promise.all([
    getThreadPosts(threadRootId, user.profileId),
    getReplies(threadRootId, user.profileId),
    getUnreadNotificationCount(user.profileId),
  ]);

  return (
    <PostThreadClient
      posts={threadPosts}
      replies={replies}
      user={user}
      notificationCount={notificationCount}
      focusPostId={params.id}
    />
  );
}
