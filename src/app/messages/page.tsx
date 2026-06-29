import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MessagesClient } from "@/components/messages/MessagesClient";
import { getSessionUser, getUnreadNotificationCount } from "@/lib/feed";
import { getConversationPreviews } from "@/lib/messages";
import { getPendingMessageRequests } from "@/lib/message-requests";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const [conversations, requests, notificationCount] = await Promise.all([
    getConversationPreviews(user.profileId),
    getPendingMessageRequests(user.profileId),
    getUnreadNotificationCount(user.profileId),
  ]);

  return (
    <MessagesClient
      user={user}
      notificationCount={notificationCount}
      conversations={conversations}
      requests={requests}
      canMessage={user.verified}
    />
  );
}
