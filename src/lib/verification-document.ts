import {
  getSignedDownloadUrl,
  isCloudStorageEnabled,
  parseStorageKey,
} from "@/lib/storage";

export async function resolveVerificationDocumentUrl(
  stored: string | null,
  profileId: string
): Promise<string | null> {
  if (!stored) return null;

  if (isCloudStorageEnabled()) {
    return getSignedDownloadUrl(parseStorageKey(stored));
  }

  if (stored.startsWith("/")) return stored;

  return `/api/verification/document?profileId=${encodeURIComponent(profileId)}`;
}
