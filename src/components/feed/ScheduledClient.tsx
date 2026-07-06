"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FeedShell } from "@/components/feed/FeedShell";
import { PostCard } from "@/components/feed/PostCard";
import { cancelScheduledPost, rescheduleScheduledPost, editScheduledPost } from "@/lib/actions";
import type { FeedPost, SessionUser } from "@/lib/types";
import { Clock, CalendarClock, Pencil } from "lucide-react";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const MUTED = "var(--eight-muted)";
const CARD = "var(--eight-card-bg)";
const ORANGE = "#e05930";
const BLUE = "#176a88";

function toDatetimeLocalValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ScheduledRow({
  post,
  pending,
  onCancel,
  onReschedule,
  onEditText,
}: {
  post: FeedPost;
  pending: boolean;
  onCancel: (id: string) => void;
  onReschedule: (id: string, iso: string) => void;
  onEditText: (id: string, body: string) => void;
}) {
  const [editingDate, setEditingDate] = useState(false);
  const [editingText, setEditingText] = useState(false);
  const [dateValue, setDateValue] = useState(toDatetimeLocalValue(post.scheduledAt));
  const [textValue, setTextValue] = useState(post.body);

  const saveDate = () => {
    if (!dateValue) return;
    onReschedule(post.id, new Date(dateValue).toISOString());
    setEditingDate(false);
  };

  const saveText = () => {
    if (!textValue.trim()) return;
    onEditText(post.id, textValue);
    setEditingText(false);
  };

  return (
    <div>
      {editingText ? (
        <div className="px-4 pt-4" style={{ borderBottom: `1px solid ${LINE}` }}>
          <textarea
            className="field field-app w-full"
            rows={4}
            maxLength={500}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
          />
          <div className="pb-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setTextValue(post.body);
                setEditingText(false);
              }}
              disabled={pending}
              className="rounded-full px-4 py-1.5 font-bold"
              style={{ fontSize: 13, border: `1px solid ${LINE}`, background: CARD, color: MUTED, cursor: "pointer" }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveText}
              disabled={pending || !textValue.trim()}
              className="rounded-full px-4 py-1.5 font-bold"
              style={{ fontSize: 13, border: "none", background: BLUE, color: "#fff", cursor: "pointer" }}
            >
              Salvar texto
            </button>
          </div>
        </div>
      ) : (
        <PostCard post={post} />
      )}

      <div
        className="px-4 pb-3 flex flex-wrap items-center justify-end gap-2"
        style={{ borderBottom: `1px solid ${LINE}` }}
      >
        {editingDate ? (
          <>
            <input
              type="datetime-local"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              className="field field-app"
              style={{ fontSize: 13, maxWidth: 220 }}
            />
            <button type="button" onClick={saveDate} disabled={pending || !dateValue} className="rounded-full px-4 py-1.5 font-bold" style={{ fontSize: 13, border: "none", background: BLUE, color: "#fff", cursor: "pointer" }}>
              Salvar data
            </button>
            <button
              type="button"
              onClick={() => {
                setDateValue(toDatetimeLocalValue(post.scheduledAt));
                setEditingDate(false);
              }}
              disabled={pending}
              className="rounded-full px-4 py-1.5 font-bold"
              style={{ fontSize: 13, border: `1px solid ${LINE}`, background: CARD, color: MUTED, cursor: "pointer" }}
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditingText(true)}
              disabled={pending || editingText}
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 font-bold"
              style={{ fontSize: 13, border: `1px solid ${LINE}`, background: CARD, color: BLUE, cursor: "pointer" }}
            >
              <Pencil size={14} />
              Editar texto
            </button>
            <button
              type="button"
              onClick={() => setEditingDate(true)}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 font-bold"
              style={{ fontSize: 13, border: `1px solid ${LINE}`, background: CARD, color: BLUE, cursor: "pointer" }}
            >
              <CalendarClock size={15} />
              Reagendar
            </button>
            <button
              type="button"
              onClick={() => onCancel(post.id)}
              disabled={pending}
              className="rounded-full px-4 py-1.5 font-bold"
              style={{ fontSize: 13, border: `1px solid ${LINE}`, background: CARD, color: ORANGE, cursor: "pointer" }}
            >
              Cancelar agendamento
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function ScheduledClient({
  user,
  notificationCount,
  posts,
}: {
  user: SessionUser;
  notificationCount: number;
  posts: FeedPost[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onCancel = (postId: string) => {
    if (!confirm("Cancelar esta publicação agendada?")) return;
    startTransition(async () => {
      await cancelScheduledPost(postId);
      router.refresh();
    });
  };

  const onReschedule = (postId: string, iso: string) => {
    startTransition(async () => {
      try {
        await rescheduleScheduledPost(postId, iso);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Erro ao reagendar");
      }
    });
  };

  const onEditText = (postId: string, body: string) => {
    startTransition(async () => {
      try {
        await editScheduledPost(postId, body);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Erro ao editar");
      }
    });
  };

  return (
    <FeedShell user={user} notificationCount={notificationCount}>
      <main className="flex-1 min-w-0" style={{ maxWidth: 620, background: CARD, borderRight: `1px solid ${LINE}` }}>
        <div className="sticky top-0 z-10 px-4 py-3" style={{ background: "var(--eight-header-bg)", borderBottom: `1px solid ${LINE}` }}>
          <h1 style={{ fontWeight: 800, fontSize: 18, color: INK }}>Posts agendados</h1>
          <p style={{ color: MUTED, fontSize: 13 }}>Publicações que ainda serão enviadas</p>
        </div>

        {posts.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Clock size={32} style={{ color: MUTED, margin: "0 auto 12px" }} />
            <p style={{ color: MUTED }}>Nenhum post agendado.</p>
            <Link href="/feed" style={{ color: BLUE, fontWeight: 600, fontSize: 14 }}>
              Voltar ao feed →
            </Link>
          </div>
        ) : (
          posts.map((p) => (
            <ScheduledRow
              key={p.id}
              post={p}
              pending={pending}
              onCancel={onCancel}
              onReschedule={onReschedule}
              onEditText={onEditText}
            />
          ))
        )}
      </main>
    </FeedShell>
  );
}
