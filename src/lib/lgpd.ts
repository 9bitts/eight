import { prisma } from "@/lib/prisma";

export async function exportUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          posts: {
            select: {
              id: true,
              body: true,
              createdAt: true,
              isClinicalCase: true,
            },
          },
          followers: { select: { followerId: true, createdAt: true } },
          following: { select: { followingId: true, createdAt: true } },
          notifications: {
            take: 500,
            orderBy: { createdAt: "desc" },
            select: { type: true, createdAt: true, read: true },
          },
        },
      },
      accounts: { select: { provider: true, providerAccountId: true } },
    },
  });

  if (!user) throw new Error("Usuário não encontrado");

  return {
    exportedAt: new Date().toISOString(),
    user: {
      email: user.email,
      name: user.name,
      locale: user.locale,
      createdAt: user.createdAt,
      totpEnabled: user.totpEnabled,
    },
    profile: user.profile
      ? {
          handle: user.profile.handle,
          displayName: user.profile.displayName,
          bio: user.profile.bio,
          specialty: user.profile.specialty,
          registrationType: user.profile.registrationType,
          registrationNumber: user.profile.registrationNumber,
          registrationCountry: user.profile.registrationCountry,
          location: user.profile.location,
          verified: user.profile.verified,
          verificationStatus: user.profile.verificationStatus,
        }
      : null,
    posts: user.profile?.posts ?? [],
    followersCount: user.profile?.followers.length ?? 0,
    followingCount: user.profile?.following.length ?? 0,
    notifications: user.profile?.notifications ?? [],
    linkedAccounts: user.accounts,
  };
}

export async function deleteUserAccount(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
}
