import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CasesClient } from "@/components/cases/CasesClient";
import { getClinicalCasePosts, getSessionUser, getUnreadNotificationCount } from "@/lib/feed";
import { prisma } from "@/lib/prisma";

export default async function CasesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const profile = await prisma.profile.findUnique({
    where: { id: user.profileId },
    select: { specialty: true },
  });

  const [posts, notificationCount] = await Promise.all([
    getClinicalCasePosts(user.profileId),
    getUnreadNotificationCount(user.profileId),
  ]);

  return (
    <CasesClient
      user={user}
      notificationCount={notificationCount}
      posts={posts}
      canPost={user.verified}
      userSpecialty={profile?.specialty ?? ""}
    />
  );
}
