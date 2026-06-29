"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveNotificationPrefs } from "@/lib/actions/notification-settings";
import type { NotificationPrefs } from "@/lib/notifications";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const MUTED = "var(--eight-muted)";

const FIELDS: { key: keyof NotificationPrefs; label: string }[] = [
  { key: "notifyLike", label: "Curtidas" },
  { key: "notifyRepost", label: "Reposts" },
  { key: "notifyFollow", label: "Novos seguidores" },
  { key: "notifyReply", label: "Respostas" },
  { key: "notifyMention", label: "Menções" },
  { key: "notifyMessage", label: "Mensagens diretas" },
];

export function NotificationPrefsSection({ initial }: { initial: NotificationPrefs }) {
  const router = useRouter();
  const [prefs, setPrefs] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof NotificationPrefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaved(false);
    startTransition(async () => {
      await saveNotificationPrefs(next);
      setSaved(true);
      router.refresh();
    });
  };

  return (
    <section className="py-4 border-b" style={{ borderColor: LINE }}>
      <h2 className="px-4 pb-2" style={{ fontWeight: 700, fontSize: 16, color: INK }}>
        Notificações
      </h2>
      <p className="px-4 pb-3" style={{ fontSize: 13, color: MUTED }}>
        Escolha quais alertas você quer receber na eight.
      </p>
      {FIELDS.map(({ key, label }) => (
        <label
          key={key}
          className="flex items-center justify-between px-4 py-3 cursor-pointer"
          style={{ borderTop: `1px solid ${LINE}` }}
        >
          <span style={{ fontSize: 15, color: INK }}>{label}</span>
          <input
            type="checkbox"
            checked={prefs[key]}
            disabled={pending}
            onChange={() => toggle(key)}
            style={{ width: 18, height: 18, accentColor: "#176a88" }}
          />
        </label>
      ))}
      {saved && (
        <p className="px-4 pt-2" style={{ fontSize: 13, color: "#1a9c5b" }}>
          Preferências salvas.
        </p>
      )}
    </section>
  );
}
