import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AnalyticsClient } from "@/components/analytics/AnalyticsClient";
import { getProfileAnalytics, getProfileViewers } from "@/lib/analytics";
import { getSessionUser, getUnreadNotificationCount } from "@/lib/feed";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const [analytics, viewers, notificationCount] = await Promise.all([
    getProfileAnalytics(user.profileId),
    getProfileViewers(user.profileId),
    getUnreadNotificationCount(user.profileId),
  ]);

  return (
    <AnalyticsClient
      user={user}
      notificationCount={notificationCount}
      analytics={analytics}
      viewers={viewers}
    />
  );
}
