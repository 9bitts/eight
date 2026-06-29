import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MessagesClient } from "@/components/messages/MessagesClient";
import { getSessionUser, getUnreadNotificationCount } from "@/lib/feed";
import { getConversationPreviews } from "@/lib/messages";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const [conversations, notificationCount] = await Promise.all([
    getConversationPreviews(user.profileId),
    getUnreadNotificationCount(user.profileId),
  ]);

  return (
    <MessagesClient
      user={user}
      notificationCount={notificationCount}
      conversations={conversations}
      canMessage={user.verified}
    />
  );
}
