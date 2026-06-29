import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { BrowseClient } from "@/components/explore/BrowseClient";
import { getSessionUser, getUnreadNotificationCount } from "@/lib/feed";
import {
  COUNTRY_LABELS,
  getCountryCount,
  getProfilesByCountry,
} from "@/lib/discovery";

type Props = { params: { code: string } };

export default async function CountryBrowsePage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const code = params.code.toUpperCase();
  const label = COUNTRY_LABELS[code];
  if (!label) notFound();

  const [profiles, count, notificationCount] = await Promise.all([
    getProfilesByCountry(code, user.profileId),
    getCountryCount(code),
    getUnreadNotificationCount(user.profileId),
  ]);

  return (
    <BrowseClient
      user={user}
      notificationCount={notificationCount}
      title={label}
      subtitle="País de registro"
      count={count}
      profiles={profiles}
    />
  );
}
