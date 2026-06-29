"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  getNotificationPrefs,
  updateNotificationPrefs,
  type NotificationPrefs,
} from "@/lib/notifications";

async function requireProfile() {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) throw new Error("Não autorizado");
  return profileId;
}

export async function loadNotificationPrefs() {
  const profileId = await requireProfile();
  return getNotificationPrefs(profileId);
}

export async function saveNotificationPrefs(prefs: NotificationPrefs) {
  const profileId = await requireProfile();
  await updateNotificationPrefs(profileId, prefs);
  revalidatePath("/settings");
}
