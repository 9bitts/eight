import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SettingsClient } from "@/components/settings/SettingsClient";
import { getSessionUser, getUnreadNotificationCount } from "@/lib/feed";
import { getBlockedUsers, getMutedUsers } from "@/lib/relationships";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const [blocked, muted, notificationCount] = await Promise.all([
    getBlockedUsers(user.profileId),
    getMutedUsers(user.profileId),
    getUnreadNotificationCount(user.profileId),
  ]);

  return (
    <SettingsClient
      user={user}
      notificationCount={notificationCount}
      blocked={blocked}
      muted={muted}
    />
  );
}
