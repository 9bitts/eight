"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NotificationPrefsSection } from "@/components/settings/NotificationPrefsSection";
import { PushNotificationSection } from "@/components/settings/PushNotificationSection";
import { saveNotificationPrefs } from "@/lib/actions/notification-settings";
import type { NotificationPrefs } from "@/lib/notifications";

export function NotificationSettings({
  initial,
  vapidPublicKey,
  pushSubscribed,
}: {
  initial: NotificationPrefs;
  vapidPublicKey: string | null;
  pushSubscribed: boolean;
}) {
  const router = useRouter();
  const [prefs, setPrefs] = useState(initial);
  const [, startTransition] = useTransition();

  const onEmailToggle = (notifyEmail: boolean) => {
    const next = { ...prefs, notifyEmail };
    setPrefs(next);
    startTransition(async () => {
      await saveNotificationPrefs(next);
      router.refresh();
    });
  };

  return (
    <>
      <NotificationPrefsSection
        initial={prefs}
        onPrefsChange={setPrefs}
      />
      <PushNotificationSection
        vapidPublicKey={vapidPublicKey}
        pushSubscribed={pushSubscribed}
        notifyEmail={prefs.notifyEmail}
        onEmailToggle={onEmailToggle}
      />
    </>
  );
}
