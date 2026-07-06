"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { FeedShell } from "@/components/feed/FeedShell";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useTheme } from "@/components/theme/ThemeProvider";
import { LOCALES } from "@/lib/i18n";
import { unblockUser, unmuteUser } from "@/lib/actions/relationships";
import {
  updateLocale,
  setup2FA,
  confirm2FA,
  disable2FA,
  deleteAccount,
} from "@/lib/actions/settings";
import { EditProfileSection, type ProfileEditData } from "@/components/settings/EditProfileSection";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { MutedWordsSection } from "@/components/settings/MutedWordsSection";
import type { NotificationPrefs } from "@/lib/notifications";
import type { ConnectionProfile, SessionUser } from "@/lib/types";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const CARD = "var(--eight-card-bg)";
const MUTED = "var(--eight-muted)";
const BLUE = "#176a88";
const ORANGE = "#e05930";

function RelationRow({
  profile,
  action,
  actionLabel,
}: {
  profile: ConnectionProfile;
  action: (id: string) => Promise<void>;
  actionLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: LINE }}>
      <Link href={`/${profile.handle}`} style={{ textDecoration: "none" }}>
        <Avatar name={profile.displayName} size={48} />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <Link href={`/${profile.handle}`} style={{ fontWeight: 700, color: INK, textDecoration: "none" }}>
            {profile.displayName}
          </Link>
          {profile.verified && <VerifiedBadge size={15} />}
        </div>
        <div style={{ color: MUTED, fontSize: 14 }}>@{profile.handle}</div>
      </div>
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            await action(profile.id);
            router.refresh();
          })
        }
        disabled={pending}
        className="rounded-full px-4 py-1.5 font-bold shrink-0"
        style={{ fontSize: 13, border: `1px solid ${LINE}`, background: CARD, color: ORANGE, cursor: "pointer" }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

export function SettingsClient({
  user,
  notificationCount,
  blocked,
  muted,
  totpEnabled,
  hasPassword,
  profile,
  notificationPrefs,
  vapidPublicKey,
  pushSubscribed,
  mutedWords,
}: {
  user: SessionUser;
  notificationCount: number;
  blocked: ConnectionProfile[];
  muted: ConnectionProfile[];
  totpEnabled: boolean;
  hasPassword: boolean;
  profile: ProfileEditData;
  notificationPrefs: NotificationPrefs;
  vapidPublicKey: string | null;
  pushSubscribed: boolean;
  mutedWords: { id: string; word: string }[];
}) {
  const router = useRouter();
  const { t, locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [twoFaSetup, setTwoFaSetup] = useState<{ secret: string; otpauth: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  const onLocale = (code: "pt" | "en" | "es") => {
    setLocale(code);
    startTransition(async () => {
      await updateLocale(code);
      router.refresh();
    });
  };

  const onSetup2FA = () => {
    setError("");
    startTransition(async () => {
      try {
        const data = await setup2FA();
        setTwoFaSetup(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      }
    });
  };

  const onConfirm2FA = () => {
    setError("");
    startTransition(async () => {
      try {
        await confirm2FA(totpCode);
        setTwoFaSetup(null);
        setTotpCode("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      }
    });
  };

  const onDisable2FA = () => {
    setError("");
    startTransition(async () => {
      try {
        await disable2FA(totpCode);
        setTotpCode("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      }
    });
  };

  const onDelete = () => {
    if (!confirm(t("settings.deleteConfirm"))) return;
    setError("");
    startTransition(async () => {
      try {
        await deleteAccount(deletePassword);
        await signOut({ callbackUrl: "/" });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      }
    });
  };

  return (
    <FeedShell user={user} notificationCount={notificationCount}>
      <main className="flex-1 min-w-0" style={{ maxWidth: 620, background: CARD, borderRight: `1px solid ${LINE}` }}>
        <div className="sticky top-0 z-10 px-4 py-3" style={{ borderBottom: `1px solid ${LINE}`, background: "var(--eight-header-bg)" }}>
          <h1 style={{ fontWeight: 800, fontSize: 20, color: INK }}>{t("settings.title")}</h1>
          <p style={{ fontSize: 14, color: MUTED, marginTop: 4 }}>{t("settings.subtitle")}</p>
        </div>

        {error && <p className="signup-error mx-4 mt-3">{error}</p>}

        <EditProfileSection profile={profile} />

        <NotificationSettings
          initial={notificationPrefs}
          vapidPublicKey={vapidPublicKey}
          pushSubscribed={pushSubscribed}
        />

        <section className="py-4 border-b" style={{ borderColor: LINE }}>
          <h2 className="px-4 pb-2" style={{ fontWeight: 700, fontSize: 16, color: INK }}>
            {t("settings.language")}
          </h2>
          <div className="px-4 flex flex-wrap gap-2">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => onLocale(l.code)}
                disabled={pending}
                className="rounded-full px-4 py-1.5 font-semibold"
                style={{
                  fontSize: 13,
                  border: `1px solid ${locale === l.code ? BLUE : LINE}`,
                  background: locale === l.code ? "var(--eight-nav-active)" : CARD,
                  color: locale === l.code ? BLUE : INK,
                  cursor: "pointer",
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </section>

        <section className="py-4 border-b" style={{ borderColor: LINE }}>
          <h2 className="px-4 pb-2" style={{ fontWeight: 700, fontSize: 16, color: INK }}>
            {t("settings.theme")}
          </h2>
          <div className="px-4 flex flex-wrap gap-2">
            {(["light", "dark"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTheme(mode)}
                className="rounded-full px-4 py-1.5 font-semibold"
                style={{
                  fontSize: 13,
                  border: `1px solid ${theme === mode ? BLUE : LINE}`,
                  background: theme === mode ? "var(--eight-nav-active)" : CARD,
                  color: theme === mode ? BLUE : INK,
                  cursor: "pointer",
                }}
              >
                {t(mode === "light" ? "settings.themeLight" : "settings.themeDark")}
              </button>
            ))}
          </div>
        </section>

        <section className="py-4 border-b" style={{ borderColor: LINE }}>
          <h2 className="px-4 pb-2" style={{ fontWeight: 700, fontSize: 16, color: INK }}>
            {t("settings.security")}
          </h2>
          <div className="px-4">
            <p style={{ fontSize: 14, fontWeight: 600, color: INK }}>{t("settings.twoFa")}</p>
            {totpEnabled ? (
              <div className="mt-2">
                <p style={{ fontSize: 13, color: "#1a9c5b", fontWeight: 600 }}>{t("settings.twoFaOn")}</p>
                <input
                  className="field field-app signup-field mt-2"
                  placeholder={t("auth.totpCode")}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                <button
                  type="button"
                  onClick={onDisable2FA}
                  disabled={pending || totpCode.length < 6}
                  className="mt-2 rounded-full px-4 py-2 font-bold"
                  style={{ border: `1px solid ${LINE}`, background: CARD, color: ORANGE, cursor: "pointer" }}
                >
                  Desativar 2FA
                </button>
              </div>
            ) : twoFaSetup ? (
              <div className="mt-2">
                <p style={{ fontSize: 13, color: MUTED, marginBottom: 8 }}>{t("settings.twoFaSetup")}</p>
                <code className="block p-2 rounded text-xs break-all" style={{ background: "var(--eight-surface-subtle)" }}>
                  {twoFaSetup.secret}
                </code>
                <input
                  className="field field-app signup-field mt-2"
                  placeholder={t("auth.totpCode")}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                <button
                  type="button"
                  onClick={onConfirm2FA}
                  disabled={pending || totpCode.length < 6}
                  className="auth-btn btn-orange mt-2 w-full"
                  style={{ border: "none", cursor: "pointer" }}
                >
                  Confirmar 2FA
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSetup2FA}
                disabled={pending || !hasPassword}
                className="mt-2 rounded-full px-4 py-2 font-bold text-white"
                style={{ background: BLUE, border: "none", cursor: "pointer", opacity: hasPassword ? 1 : 0.5 }}
              >
                {t("settings.twoFaOff")}
              </button>
            )}
            {!hasPassword && (
              <p style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>
                2FA por app requer login com e-mail e senha.
              </p>
            )}
          </div>
        </section>

        <section className="py-4 border-b" style={{ borderColor: LINE }}>
          <h2 className="px-4 pb-2" style={{ fontWeight: 700, fontSize: 16, color: INK }}>
            {t("settings.lgpd")}
          </h2>
          <div className="px-4 space-y-3">
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: INK }}>{t("settings.export")}</p>
              <p style={{ fontSize: 13, color: MUTED }}>{t("settings.exportDesc")}</p>
              <a
                href="/api/account/export"
                className="inline-block mt-2 rounded-full px-4 py-2 font-bold"
                style={{ background: "var(--eight-surface-subtle)", color: BLUE, textDecoration: "none", fontSize: 13 }}
              >
                Download JSON
              </a>
            </div>
            <div className="pt-2 border-t" style={{ borderColor: LINE }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: ORANGE }}>{t("settings.delete")}</p>
              <p style={{ fontSize: 13, color: MUTED }}>{t("settings.deleteDesc")}</p>
              {hasPassword && (
                <input
                  type="password"
                  className="field field-app signup-field mt-2"
                  placeholder="Senha para confirmar"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
              )}
              <button
                type="button"
                onClick={onDelete}
                disabled={pending || (hasPassword && !deletePassword)}
                className="mt-2 rounded-full px-4 py-2 font-bold text-white"
                style={{ background: ORANGE, border: "none", cursor: "pointer" }}
              >
                {t("settings.delete")}
              </button>
            </div>
          </div>
        </section>

        <MutedWordsSection initialWords={mutedWords} />

        <section className="py-4 border-b" style={{ borderColor: LINE }}>
          <h2 className="px-4 pb-2" style={{ fontWeight: 700, fontSize: 16, color: INK }}>
            {t("settings.blocked")}
          </h2>
          {blocked.length === 0 ? (
            <p className="px-4 py-4 text-center" style={{ color: "#9fb0b6", fontSize: 14 }}>—</p>
          ) : (
            blocked.map((p) => (
              <RelationRow key={p.id} profile={p} action={unblockUser} actionLabel="Desbloquear" />
            ))
          )}
        </section>

        <section className="py-4 border-b" style={{ borderColor: LINE }}>
          <h2 className="px-4 pb-2" style={{ fontWeight: 700, fontSize: 16, color: INK }}>
            {t("settings.muted")}
          </h2>
          {muted.length === 0 ? (
            <p className="px-4 py-4 text-center" style={{ color: "#9fb0b6", fontSize: 14 }}>—</p>
          ) : (
            muted.map((p) => (
              <RelationRow key={p.id} profile={p} action={unmuteUser} actionLabel="Dessilenciar" />
            ))
          )}
        </section>

        <div className="px-4 py-6 flex flex-col gap-2">
          <Link href="/analytics" style={{ color: BLUE, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
            Analytics do perfil →
          </Link>
          <Link href="/agendados" style={{ color: BLUE, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
            Posts agendados →
          </Link>
          <Link href="/verificacao" style={{ color: BLUE, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
            {t("settings.verification")} →
          </Link>
        </div>
      </main>
    </FeedShell>
  );
}
