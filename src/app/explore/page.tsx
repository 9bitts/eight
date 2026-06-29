import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ExploreClient } from "@/components/explore/ExploreClient";
import { getSessionUser, getTrendingHashtags, getUnreadNotificationCount } from "@/lib/feed";
import { getTopCountries, getTopSpecialties } from "@/lib/discovery";

export default async function ExplorePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const [notificationCount, specialties, countries, trends] = await Promise.all([
    getUnreadNotificationCount(user.profileId),
    getTopSpecialties(12),
    getTopCountries(6),
    getTrendingHashtags(6),
  ]);

  return (
    <ExploreClient
      user={user}
      notificationCount={notificationCount}
      specialties={specialties}
      countries={countries}
      trends={trends}
    />
  );
}
