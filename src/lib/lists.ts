import { prisma } from "@/lib/prisma";
import { formatSpec } from "@/lib/format";
import type { ConnectionProfile } from "@/lib/types";

export type ProfileListSummary = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
};

export async function getMyLists(ownerId: string): Promise<ProfileListSummary[]> {
  const rows = await prisma.profileList.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    memberCount: r._count.members,
  }));
}

export async function getListDetail(listId: string, ownerId: string) {
  const list = await prisma.profileList.findFirst({
    where: { id: listId, ownerId },
    include: {
      members: {
        include: {
          profile: {
            select: {
              id: true,
              displayName: true,
              handle: true,
              specialty: true,
              registrationType: true,
              registrationNumber: true,
              verified: true,
            },
          },
        },
        orderBy: { addedAt: "desc" },
      },
    },
  });
  if (!list) return null;

  const members: ConnectionProfile[] = list.members.map((m) => ({
    id: m.profile.id,
    displayName: m.profile.displayName,
    handle: m.profile.handle,
    spec: formatSpec(
      m.profile.specialty,
      m.profile.registrationType,
      m.profile.registrationNumber
    ),
    verified: m.profile.verified,
    following: false,
    followsYou: false,
  }));

  return {
    id: list.id,
    name: list.name,
    description: list.description,
    members,
  };
}

export async function getListsForProfile(ownerId: string, profileId: string) {
  return prisma.profileList.findMany({
    where: { ownerId },
    select: {
      id: true,
      name: true,
      members: { where: { profileId }, select: { profileId: true } },
    },
    orderBy: { name: "asc" },
  });
}
