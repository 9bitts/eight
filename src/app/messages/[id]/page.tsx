import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ConversationClient } from "@/components/messages/ConversationClient";
import { getSessionUser, getUnreadNotificationCount } from "@/lib/feed";
import { getConversationMessages } from "@/lib/messages";
import { getGroupAddCandidates } from "@/lib/actions/groups";

type Props = { params: { id: string } };

export default async function ConversationPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const data = await getConversationMessages(params.id, user.profileId);
  if (!data) notFound();

  const [notificationCount, addCandidates] = await Promise.all([
    getUnreadNotificationCount(user.profileId),
    data.isGroup ? getGroupAddCandidates(params.id) : Promise.resolve([]),
  ]);

  return (
    <ConversationClient
      user={user}
      notificationCount={notificationCount}
      conversationId={params.id}
      conversation={data}
      addCandidates={addCandidates}
    />
  );
}
