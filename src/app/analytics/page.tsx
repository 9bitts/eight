import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AnalyticsClient } from "@/components/analytics/AnalyticsClient";
import { getProfileAnalytics, getProfileViewers } from "@/lib/analytics";
import { getPostViewAnalytics, getViewTimeline } from "@/lib/post-analytics";
import { getSessionUser, getUnreadNotificationCount } from "@/lib/feed";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const [analytics, viewers, postAnalytics, viewTimeline, notificationCount] = await Promise.all([
    getProfileAnalytics(user.profileId),
    getProfileViewers(user.profileId),
    getPostViewAnalytics(user.profileId),
    getViewTimeline(user.profileId, 14),
    getUnreadNotificationCount(user.profileId),
  ]);

  return (
    <AnalyticsClient
      user={user}
      notificationCount={notificationCount}
      analytics={analytics}
      viewers={viewers}
      postAnalytics={postAnalytics}
      viewTimeline={viewTimeline}
    />
  );
}
