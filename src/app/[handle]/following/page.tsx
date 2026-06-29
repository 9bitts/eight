import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ConnectionsClient } from "@/components/connections/ConnectionsClient";
import {
  getProfileByHandle,
  getSessionUser,
  getUnreadNotificationCount,
} from "@/lib/feed";
import { getBlockStatus, getFollowingList } from "@/lib/relationships";

import { isReservedHandle } from "@/lib/reserved-handles";

type Props = { params: { handle: string } };

export default async function FollowingPage({ params }: Props) {
  const handle = params.handle.toLowerCase();
  if (isReservedHandle(handle)) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const profile = await getProfileByHandle(handle, user.profileId);
  if (!profile) notFound();

  const blockStatus = await getBlockStatus(user.profileId, profile.id);
  if (blockStatus.blockedByTarget) {
    return (
      <ConnectionsClient
        user={user}
        notificationCount={await getUnreadNotificationCount(user.profileId)}
        profileHandle={profile.handle}
        profileName={profile.displayName}
        tab="following"
        connections={[]}
      />
    );
  }

  const [connections, notificationCount] = await Promise.all([
    getFollowingList(profile.id, user.profileId),
    getUnreadNotificationCount(user.profileId),
  ]);

  return (
    <ConnectionsClient
      user={user}
      notificationCount={notificationCount}
      profileHandle={profile.handle}
      profileName={profile.displayName}
      tab="following"
      connections={connections}
    />
  );
}
