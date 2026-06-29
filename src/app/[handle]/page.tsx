import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProfileClient } from "@/components/profile/ProfileClient";
import {
  getFeedPosts,
  getProfileByHandle,
  getSessionUser,
  getUnreadNotificationCount,
  isFollowing,
} from "@/lib/feed";

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
]);

type Props = { params: { handle: string } };

export default async function ProfilePage({ params }: Props) {
  const handle = params.handle.toLowerCase();
  if (RESERVED.has(handle)) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const profile = await getProfileByHandle(handle);
  if (!profile) notFound();

  const [posts, notificationCount, following] = await Promise.all([
    getFeedPosts(user.profileId, "forYou", profile.id),
    getUnreadNotificationCount(user.profileId),
    isFollowing(user.profileId, profile.id),
  ]);

  return (
    <ProfileClient
      profile={{
        id: profile.id,
        handle: profile.handle,
        displayName: profile.displayName,
        bio: profile.bio,
        specialty: profile.specialty,
        registrationType: profile.registrationType,
        registrationNumber: profile.registrationNumber,
        location: profile.location,
        verified: profile.verified,
        followers: profile._count.followers,
        following: profile._count.following,
        postsCount: profile._count.posts,
      }}
      posts={posts}
      user={user}
      isOwnProfile={profile.id === user.profileId}
      isFollowing={following}
      notificationCount={notificationCount}
    />
  );
}
