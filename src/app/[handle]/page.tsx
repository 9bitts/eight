import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { ProfileClient } from "@/components/profile/ProfileClient";
import {
  getFeedPosts,
  getProfileByHandle,
  getProfileReplies,
  getSessionUser,
  getUnreadNotificationCount,
  isFollowing,
} from "@/lib/feed";
import { getBlockStatus, isMuted } from "@/lib/relationships";
import { recordProfileView, getProfileAnalytics } from "@/lib/analytics";

import { isReservedHandle } from "@/lib/reserved-handles";
import { buildProfileMetadata } from "@/lib/metadata";

type Props = { params: { handle: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return buildProfileMetadata(params.handle);
}

export default async function ProfilePage({ params }: Props) {
  const handle = params.handle.toLowerCase();
  if (isReservedHandle(handle)) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getSessionUser(session.user.id);
  if (!user) redirect("/signup/complete");

  const profile = await getProfileByHandle(handle);
  if (!profile) notFound();

  const isOwnProfile = profile.id === user.profileId;

  const [posts, replies, notificationCount, following, blockStatus, muted, analytics] =
    await Promise.all([
      getFeedPosts(user.profileId, "forYou", profile.id),
      getProfileReplies(profile.id, user.profileId),
      getUnreadNotificationCount(user.profileId),
      isFollowing(user.profileId, profile.id),
      getBlockStatus(user.profileId, profile.id),
      isMuted(user.profileId, profile.id),
      isOwnProfile ? getProfileAnalytics(profile.id) : Promise.resolve(null),
    ]);

  if (!isOwnProfile && !blockStatus.isBlocked) {
    await recordProfileView(profile.id, user.profileId);
  }

  const teleconsultUrl =
    profile.teleconsultUrl ||
    (profile.verified ? process.env.NEXT_PUBLIC_DOCTOR8_TELECONSULT_URL ?? null : null);

  const canMessage =
    user.verified &&
    profile.verified &&
    !blockStatus.isBlocked &&
    profile.id !== user.profileId;

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
        teleconsultUrl,
        avatarUrl: profile.avatarUrl,
        bannerUrl: profile.bannerUrl,
      }}
      posts={posts}
      replies={replies}
      user={user}
      isOwnProfile={profile.id === user.profileId}
      isFollowing={following}
      blockedByViewer={blockStatus.blockedByViewer}
      blockedByTarget={blockStatus.blockedByTarget}
      isMuted={muted}
      canMessage={canMessage}
      notificationCount={notificationCount}
      analytics={analytics}
    />
  );
}
