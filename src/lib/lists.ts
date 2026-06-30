import { prisma } from "@/lib/prisma";
import { formatSpec } from "@/lib/format";
import { mapConnections } from "@/lib/relationships";
import type { ConnectionProfile } from "@/lib/types";

export type ProfileListSummary = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  isPublic: boolean;
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
    isPublic: r.isPublic,
  }));
}

export async function getPublicListsForProfile(ownerId: string): Promise<ProfileListSummary[]> {
  const rows = await prisma.profileList.findMany({
    where: { ownerId, isPublic: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { members: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    memberCount: r._count.members,
    isPublic: true,
  }));
}

export async function getListForViewer(
  listId: string,
  viewerProfileId?: string
): Promise<{ list: ListDetail; isOwner: boolean } | null> {
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
  if (!isOwner && !row.isPublic) return null;

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
  if (row.isPublic) return true;
  return viewerProfileId === row.ownerId;
}
