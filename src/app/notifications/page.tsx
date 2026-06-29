import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { NotificationsClient } from "@/components/notifications/NotificationsClient";
import { markNotificationsRead } from "@/lib/actions";
import { getSessionUser } from "@/lib/feed";
import { prisma } from "@/lib/prisma";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const notifications = await prisma.notification.findMany({
    where: { recipientId: user.profileId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      actor: {
        select: { displayName: true, handle: true, verified: true },
      },
    },
  });

  await markNotificationsRead();

  return (
    <NotificationsClient
      user={user}
      notifications={notifications}
      notificationCount={0}
    />
  );
}
