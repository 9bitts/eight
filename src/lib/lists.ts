import { prisma } from "@/lib/prisma";
import { formatSpec } from "@/lib/format";
import { mapConnections } from "@/lib/relationships";
import { canAccessList } from "@/lib/list-access";
import type { ConnectionProfile } from "@/lib/types";

export type ProfileListSummary = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  isPublic: boolean;
};

export type FollowedListSummary = ProfileListSummary & {
  owner: { displayName: string; handle: string };
};

export type ListDetail = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  owner: {
    id: string;
    displayName: string;
    handle: string;
    verified: boolean;
  };
  members: ConnectionProfile[];
};

const memberProfileSelect = {
  id: true,
  displayName: true,
  handle: true,
  specialty: true,
  registrationType: true,
  registrationNumber: true,
  verified: true,
} as const;

function mapListSummary(row: {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  _count: { members: number };
}): ProfileListSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    memberCount: row._count.members,
    isPublic: row.isPublic,
  };
}

export async function getMyLists(ownerId: string): Promise<ProfileListSummary[]> {
  const rows = await prisma.profileList.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true } } },
  });
  return rows.map(mapListSummary);
}

export async function getFollowedLists(profileId: string): Promise<FollowedListSummary[]> {
  const rows = await prisma.listFollow.findMany({
    where: { profileId },
    orderBy: { createdAt: "desc" },
    include: {
      list: {
        include: {
          owner: { select: { displayName: true, handle: true } },
          _count: { select: { members: true } },
        },
      },
    },
  });

  return rows
    .filter((r) => r.list.isPublic)
    .map((r) => ({
      ...mapListSummary(r.list),
      owner: r.list.owner,
    }));
}

export async function isFollowingList(profileId: string, listId: string): Promise<boolean> {
  const row = await prisma.listFollow.findUnique({
    where: { profileId_listId: { profileId, listId } },
  });
  return !!row;
}

export async function getPublicListsForProfile(ownerId: string): Promise<ProfileListSummary[]> {
  const rows = await prisma.profileList.findMany({
    where: { ownerId, isPublic: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { members: true } } },
  });
  return rows.map((r) => ({ ...mapListSummary(r), isPublic: true }));
}

export async function getListForViewer(
  listId: string,
  viewerProfileId?: string
): Promise<{ list: ListDetail; isOwner: boolean; isFollowing: boolean } | null> {
  const row = await prisma.profileList.findUnique({
    where: { id: listId },
    include: {
      owner: {
        select: { id: true, displayName: true, handle: true, verified: true },
      },
      members: {
        include: { profile: { select: memberProfileSelect } },
        orderBy: { addedAt: "desc" },
      },
    },
  });
  if (!row) return null;

  const isOwner = viewerProfileId === row.ownerId;
  if (!canAccessList(row, viewerProfileId)) return null;

  const isFollowing = viewerProfileId
    ? await isFollowingList(viewerProfileId, listId)
    : false;

  const rawMembers = row.members.map((m) => m.profile);
  const members = viewerProfileId
    ? await mapConnections(rawMembers, viewerProfileId)
    : rawMembers.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        handle: p.handle,
        spec: formatSpec(p.specialty, p.registrationType, p.registrationNumber),
        verified: p.verified,
        following: false,
        followsYou: false,
      }));

  return {
    isOwner,
    isFollowing,
    list: {
      id: row.id,
      name: row.name,
      description: row.description,
      isPublic: row.isPublic,
      owner: row.owner,
      members,
    },
  };
}

/** @deprecated use getListForViewer */
export async function getListDetail(listId: string, ownerId: string) {
  const result = await getListForViewer(listId, ownerId);
  if (!result?.isOwner) return null;
  return result.list;
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

export async function canViewListPosts(listId: string, viewerProfileId?: string) {
  const row = await prisma.profileList.findUnique({
    where: { id: listId },
    select: { ownerId: true, isPublic: true },
  });
  if (!row) return false;
  return canAccessList(row, viewerProfileId);
}

export async function getFollowedListMemberIds(profileId: string): Promise<string[]> {
  const follows = await prisma.listFollow.findMany({
    where: { profileId, list: { isPublic: true } },
    select: {
      list: {
        select: {
          members: { select: { profileId: true } },
        },
      },
    },
  });

  const ids = new Set<string>();
  for (const f of follows) {
    for (const m of f.list.members) {
      ids.add(m.profileId);
    }
  }
  return Array.from(ids);
}
