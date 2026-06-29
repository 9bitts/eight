"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FeedShell } from "@/components/feed/FeedShell";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { unblockUser, unmuteUser } from "@/lib/actions/relationships";
import type { ConnectionProfile, SessionUser } from "@/lib/types";

const INK = "#0c2b36";
const LINE = "#e4ebee";
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

  const onAction = () => {
    startTransition(async () => {
      await action(profile.id);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: LINE }}>
      <Link href={`/${profile.handle}`} style={{ textDecoration: "none" }}>
        <Avatar name={profile.displayName} size={48} />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <Link
            href={`/${profile.handle}`}
            style={{ fontWeight: 700, color: INK, textDecoration: "none" }}
          >
            {profile.displayName}
          </Link>
          {profile.verified && <VerifiedBadge size={15} />}
        </div>
        <div style={{ color: "#7a8f97", fontSize: 14 }}>@{profile.handle}</div>
      </div>
      <button
        type="button"
        onClick={onAction}
        disabled={pending}
        className="rounded-full px-4 py-1.5 font-bold shrink-0"
        style={{
          fontSize: 13,
          border: `1px solid ${LINE}`,
          background: "#fff",
          color: ORANGE,
          cursor: "pointer",
        }}
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
}: {
  user: SessionUser;
  notificationCount: number;
  blocked: ConnectionProfile[];
  muted: ConnectionProfile[];
}) {
  return (
    <FeedShell user={user} notificationCount={notificationCount}>
      <main className="flex-1 min-w-0" style={{ maxWidth: 620, background: "#fff", borderRight: `1px solid ${LINE}` }}>
        <div className="sticky top-0 z-10 px-4 py-3" style={{ borderBottom: `1px solid ${LINE}`, background: "#fff" }}>
          <h1 style={{ fontWeight: 800, fontSize: 20, color: INK }}>Configurações</h1>
          <p style={{ fontSize: 14, color: "#7a8f97", marginTop: 4 }}>
            Gerencie bloqueios e silenciamentos
          </p>
        </div>

        <section className="py-4">
          <h2 className="px-4 pb-2" style={{ fontWeight: 700, fontSize: 16, color: INK }}>
            Bloqueados
          </h2>
          <p className="px-4 pb-3" style={{ fontSize: 13, color: "#7a8f97", lineHeight: 1.45 }}>
            Perfis bloqueados não podem ver seu conteúdo nem interagir com você.
          </p>
          {blocked.length === 0 ? (
            <p className="px-4 py-6 text-center" style={{ color: "#9fb0b6", fontSize: 14 }}>
              Nenhum perfil bloqueado.
            </p>
          ) : (
            blocked.map((p) => (
              <RelationRow
                key={p.id}
                profile={p}
                action={unblockUser}
                actionLabel="Desbloquear"
              />
            ))
          )}
        </section>

        <section className="py-4 border-t" style={{ borderColor: LINE }}>
          <h2 className="px-4 pb-2" style={{ fontWeight: 700, fontSize: 16, color: INK }}>
            Silenciados
          </h2>
          <p className="px-4 pb-3" style={{ fontSize: 13, color: "#7a8f97", lineHeight: 1.45 }}>
            Publicações de perfis silenciados não aparecem no seu feed.
          </p>
          {muted.length === 0 ? (
            <p className="px-4 py-6 text-center" style={{ color: "#9fb0b6", fontSize: 14 }}>
              Nenhum perfil silenciado.
            </p>
          ) : (
            muted.map((p) => (
              <RelationRow
                key={p.id}
                profile={p}
                action={unmuteUser}
                actionLabel="Dessilenciar"
              />
            ))
          )}
        </section>

        <div className="px-4 py-6">
          <Link href="/verificacao" style={{ color: BLUE, fontWeight: 600, fontSize: 14 }}>
            Verificação profissional →
          </Link>
        </div>
      </main>
    </FeedShell>
  );
}
