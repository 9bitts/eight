"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, X, UserMinus } from "lucide-react";
import { renameGroup, removeGroupMember } from "@/lib/actions/groups";
import { GROUP_NAME_MAX_LENGTH } from "@/lib/constants";

const LINE = "var(--eight-line)";
const CARD = "var(--eight-card-bg)";
const INK = "var(--eight-ink)";
const MUTED = "var(--eight-muted)";
const BLUE = "#176a88";
const ORANGE = "#e05930";

type Member = { id: string; name: string; handle: string };

export function GroupManageDialog({
  conversationId,
  groupName,
  members,
  isCreator,
  currentUserId,
  onClose,
}: {
  conversationId: string;
  groupName: string;
  members: Member[];
  isCreator: boolean;
  currentUserId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(groupName);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const saveName = () => {
    setError("");
    startTransition(async () => {
      try {
        await renameGroup(conversationId, name);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao renomear");
      }
    });
  };

  const remove = (memberId: string, memberName: string) => {
    if (!confirm(`Remover ${memberName} do grupo?`)) return;
    setError("");
    startTransition(async () => {
      try {
        await removeGroupMember(conversationId, memberId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao remover membro");
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border shadow-xl max-h-[85vh] flex flex-col"
        style={{ background: CARD, borderColor: LINE }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: LINE }}>
          <div className="flex items-center gap-2">
            <Settings size={20} style={{ color: BLUE }} />
            <h2 style={{ fontWeight: 800, fontSize: 18, color: INK }}>Gerenciar grupo</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1">
          <label style={{ fontSize: 13, fontWeight: 700, color: INK }}>Nome do grupo</label>
          <div className="flex gap-2 mt-1 mb-5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={GROUP_NAME_MAX_LENGTH}
              className="flex-1 px-3 py-2 rounded-lg border outline-none"
              style={{ borderColor: LINE, fontSize: 15 }}
            />
            <button
              type="button"
              onClick={saveName}
              disabled={pending || !name.trim() || name.trim() === groupName}
              className="rounded-lg px-4 font-bold text-white shrink-0"
              style={{
                background: BLUE,
                border: "none",
                cursor: "pointer",
                opacity: name.trim() && name.trim() !== groupName && !pending ? 1 : 0.5,
              }}
            >
              Salvar
            </button>
          </div>

          <p style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 8 }}>
            Membros ({members.length})
          </p>
          <div className="flex flex-col gap-1">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg"
                style={{ background: "var(--eight-nav-active)" }}
              >
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/${m.handle}`}
                    style={{ fontWeight: 600, fontSize: 14, color: INK, textDecoration: "none" }}
                  >
                    {m.name}
                    {m.id === currentUserId && (
                      <span style={{ color: MUTED, fontWeight: 500 }}> (você)</span>
                    )}
                  </Link>
                  <div style={{ fontSize: 13, color: MUTED }}>@{m.handle}</div>
                </div>
                {isCreator && m.id !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => remove(m.id, m.name)}
                    disabled={pending}
                    title="Remover do grupo"
                    style={{
                      color: ORANGE,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    <UserMinus size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {error && <p className="signup-error mt-3">{error}</p>}
          {isCreator && (
            <p style={{ fontSize: 12, color: MUTED, marginTop: 12, lineHeight: 1.45 }}>
              Como criador do grupo, você pode renomeá-lo e remover membros.
            </p>
          )}
        </div>

        <div className="px-5 py-3 border-t flex justify-end" style={{ borderColor: LINE }}>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-2 font-bold"
            style={{ border: `1px solid ${LINE}`, background: CARD, cursor: "pointer" }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
