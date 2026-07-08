import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SettingsClient } from "@/components/settings/SettingsClient";
import { getSessionUser, getUnreadNotificationCount } from "@/lib/feed";
import { getBlockedUsers, getMutedUsers } from "@/lib/relationships";
import { getProfileForEdit } from "@/lib/actions/profile";
import { getNotificationPrefs, countPushSubscriptions } from "@/lib/notifications";
import { getVapidPublicKey } from "@/lib/push";
import { getMutedWordsForSettings } from "@/lib/actions/muted-words";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true, locale: true },
  });

  const [blocked, muted, notificationCount, profileData, notificationPrefs, pushCount, mutedWords] =
    await Promise.all([
    getBlockedUsers(user.profileId),
    getMutedUsers(user.profileId),
    getUnreadNotificationCount(user.profileId),
    getProfileForEdit(),
    getNotificationPrefs(user.profileId),
    countPushSubscriptions(user.profileId),
    getMutedWordsForSettings(),
  ]);

  if (!profileData) redirect("/signup/complete");

  return (
    <SettingsClient
      user={user}
      notificationCount={notificationCount}
      blocked={blocked}
      muted={muted}
      hasPassword={!!dbUser?.passwordHash}
      profile={profileData}
      notificationPrefs={notificationPrefs}
      vapidPublicKey={getVapidPublicKey()}
      pushSubscribed={pushCount > 0}
      mutedWords={mutedWords}
    />
  );
}
