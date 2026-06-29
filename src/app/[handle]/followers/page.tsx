import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ConnectionsClient } from "@/components/connections/ConnectionsClient";
import {
  getProfileByHandle,
  getSessionUser,
  getUnreadNotificationCount,
} from "@/lib/feed";
import { getBlockStatus, getFollowersList } from "@/lib/relationships";

const RESERVED = new Set([
  "feed",
  "login",
  "signup",
  "api",
  "post",
  "explore",
  "notifications",
  "messages",
  "cases",
  "settings",
  "followers",
  "following",
]);

type Props = { params: { handle: string } };

export default async function FollowersPage({ params }: Props) {
  const handle = params.handle.toLowerCase();
  if (RESERVED.has(handle)) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const profile = await getProfileByHandle(handle);
  if (!profile) notFound();

  const blockStatus = await getBlockStatus(user.profileId, profile.id);
  if (blockStatus.blockedByTarget) {
    return (
      <ConnectionsClient
        user={user}
        notificationCount={await getUnreadNotificationCount(user.profileId)}
        profileHandle={profile.handle}
        profileName={profile.displayName}
        tab="followers"
        connections={[]}
      />
    );
  }

  const [connections, notificationCount] = await Promise.all([
    getFollowersList(profile.id, user.profileId),
    getUnreadNotificationCount(user.profileId),
  ]);

  return (
    <ConnectionsClient
      user={user}
      notificationCount={notificationCount}
      profileHandle={profile.handle}
      profileName={profile.displayName}
      tab="followers"
      connections={connections}
    />
  );
}
