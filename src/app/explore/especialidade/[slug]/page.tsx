import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { BrowseClient } from "@/components/explore/BrowseClient";
import { getSessionUser, getUnreadNotificationCount } from "@/lib/feed";
import {
  getProfilesBySpecialty,
  getSpecialtyCount,
  labelFromSlug,
} from "@/lib/discovery";

type Props = { params: { slug: string } };

export default async function SpecialtyBrowsePage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const slug = decodeURIComponent(params.slug).toLowerCase();
  const label = labelFromSlug(slug);
  if (!label.trim()) notFound();

  const [profiles, count, notificationCount] = await Promise.all([
    getProfilesBySpecialty(slug, user.profileId),
    getSpecialtyCount(slug),
    getUnreadNotificationCount(user.profileId),
  ]);

  return (
    <BrowseClient
      user={user}
      notificationCount={notificationCount}
      title={label}
      subtitle="Especialidade"
      count={count}
      profiles={profiles}
    />
  );
}
