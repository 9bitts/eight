export function canAccessList(
  list: { isPublic: boolean; ownerId: string },
  viewerProfileId?: string | null
): boolean {
  if (!viewerProfileId) return list.isPublic;
  if (viewerProfileId === list.ownerId) return true;
  return list.isPublic;
}

export function canFollowList(
  list: { isPublic: boolean; ownerId: string },
  profileId: string
): boolean {
  if (!list.isPublic) return false;
  if (list.ownerId === profileId) return false;
  return true;
}
