import { SSE_MAX_CONNECTIONS_PER_USER } from "@/lib/constants";

const active = new Map<string, number>();

export function acquireSseConnection(profileId: string): boolean {
  const count = active.get(profileId) ?? 0;
  if (count >= SSE_MAX_CONNECTIONS_PER_USER) return false;
  active.set(profileId, count + 1);
  return true;
}

export function releaseSseConnection(profileId: string) {
  const count = active.get(profileId) ?? 0;
  if (count <= 1) active.delete(profileId);
  else active.set(profileId, count - 1);
}
