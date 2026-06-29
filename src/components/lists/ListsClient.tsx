"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FeedShell } from "@/components/feed/FeedShell";
import { createList, deleteList } from "@/lib/actions/lists";
import type { ProfileListSummary } from "@/lib/lists";
import type { SessionUser } from "@/lib/types";
import { List, Plus, Trash2 } from "lucide-react";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const MUTED = "var(--eight-muted)";
const CARD = "var(--eight-card-bg)";
const BLUE = "#176a88";

export function ListsClient({
  user,
  notificationCount,
  lists,
}: {
  user: SessionUser;
  notificationCount: number;
  lists: ProfileListSummary[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const onCreate = () => {
    setError("");
    startTransition(async () => {
      try {
        await createList(name);
        setName("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao criar lista.");
      }
    });
  };

  const onDelete = (id: string, listName: string) => {
    if (!confirm(`Excluir a lista "${listName}"?`)) return;
    startTransition(async () => {
      await deleteList(id);
      router.refresh();
    });
  };

  return (
    <FeedShell user={user} notificationCount={notificationCount}>
      <main
        className="flex-1 min-w-0"
        style={{ maxWidth: 620, background: CARD, borderRight: `1px solid ${LINE}` }}
      >
        <div
          className="sticky top-0 z-10 px-4 py-3"
          style={{ background: "var(--eight-header-bg)", borderBottom: `1px solid ${LINE}` }}
        >
          <h1 style={{ fontWeight: 800, fontSize: 18, color: INK }}>Listas</h1>
          <p style={{ color: MUTED, fontSize: 13 }}>Organize perfis em listas privadas</p>
        </div>

        <div className="p-4 border-b" style={{ borderColor: LINE }}>
          <div className="flex gap-2">
            <input
              className="field flex-1"
              placeholder="Nome da lista"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />
            <button
              type="button"
              onClick={onCreate}
              disabled={pending || name.trim().length < 2}
              className="rounded-full px-4 py-2 font-bold text-white flex items-center gap-1"
              style={{ background: BLUE, border: "none", cursor: "pointer", opacity: pending ? 0.6 : 1 }}
            >
              <Plus size={16} />
              Criar
            </button>
          </div>
          {error && <p className="mt-2 text-sm" style={{ color: "#e05930" }}>{error}</p>}
        </div>

        {lists.length === 0 ? (
          <p className="px-4 py-12 text-center" style={{ color: MUTED }}>
            Você ainda não criou listas. Use o menu ··· no perfil de alguém para adicionar.
          </p>
        ) : (
          lists.map((list) => (
            <div
              key={list.id}
              className="flex items-center gap-3 px-4 py-3 border-b"
              style={{ borderColor: LINE }}
            >
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{ width: 44, height: 44, background: "var(--eight-nav-active)", color: BLUE }}
              >
                <List size={20} />
              </div>
              <Link href={`/listas/${list.id}`} className="flex-1 min-w-0" style={{ textDecoration: "none" }}>
                <div style={{ fontWeight: 700, color: INK }}>{list.name}</div>
                <div style={{ fontSize: 13, color: MUTED }}>
                  {list.memberCount} {list.memberCount === 1 ? "perfil" : "perfis"}
                  {list.description ? ` · ${list.description}` : ""}
                </div>
              </Link>
              <button
                type="button"
                onClick={() => onDelete(list.id, list.name)}
                disabled={pending}
                className="p-2 rounded-full"
                style={{ border: "none", background: "transparent", color: MUTED, cursor: "pointer" }}
                title="Excluir lista"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </main>
    </FeedShell>
  );
}
