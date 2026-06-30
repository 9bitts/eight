"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Image as ImageIcon, X, Loader2, Users, LogOut, UserPlus, Settings } from "lucide-react";
import { FeedShell } from "@/components/feed/FeedShell";
import { AddMembersDialog } from "@/components/messages/AddMembersDialog";
import { GroupManageDialog } from "@/components/messages/GroupManageDialog";
import { sendDirectMessage } from "@/lib/actions/messages";
import { leaveGroup } from "@/lib/actions/groups";
import { formatMessageTime, type ChatMessage, type ConversationDetail } from "@/lib/messages";
import { useRealtimeBadges } from "@/components/useRealtime";
import { DM_MAX_LENGTH } from "@/lib/constants";
import type { SessionUser } from "@/lib/types";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const CARD = "var(--eight-card-bg)";
const MUTED = "var(--eight-muted)";
const BLUE = "#176a88";
const ORANGE = "#e05930";

export function ConversationClient({
  user,
  notificationCount,
  conversationId,
  conversation,
  addCandidates = [],
}: {
  user: SessionUser;
  notificationCount: number;
  conversationId: string;
  conversation: ConversationDetail;
  addCandidates?: { id: string; name: string; handle: string }[];
}) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(conversation.messages);
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showManageGroup, setShowManageGroup] = useState(false);
  const [pending, startTransition] = useTransition();

  const { isGroup, title, name, otherHandle, participants, isCreator } = conversation;

  useEffect(() => {
    setMessages(conversation.messages);
  }, [conversation.messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onRealtime = useCallback(
    (data: { messagesUpdated?: boolean }) => {
      if (data.messagesUpdated) router.refresh();
    },
    [router]
  );

  useRealtimeBadges(onRealtime, conversationId);

  const uploadImage = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha no upload");
      if (json.type !== "image") throw new Error("Use apenas imagens nas mensagens.");
      setImageUrl(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  };

  const send = () => {
    const body = text.trim();
    if ((!body && !imageUrl) || pending || uploading) return;
    setError("");
    startTransition(async () => {
      try {
        await sendDirectMessage(conversationId, body, imageUrl);
        setText("");
        setImageUrl(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao enviar");
      }
    });
  };

  const onLeaveGroup = () => {
    if (!confirm("Sair deste grupo?")) return;
    startTransition(async () => {
      await leaveGroup(conversationId);
      router.push("/messages");
    });
  };

  return (
    <FeedShell user={user} notificationCount={notificationCount}>
      {showAddMembers && (
        <AddMembersDialog
          conversationId={conversationId}
          candidates={addCandidates}
          onClose={() => setShowAddMembers(false)}
        />
      )}
      {showManageGroup && isGroup && (
        <GroupManageDialog
          conversationId={conversationId}
          groupName={name ?? title}
          members={participants}
          isCreator={isCreator}
          currentUserId={user.profileId}
          onClose={() => setShowManageGroup(false)}
        />
      )}
      <main
        className="flex-1 min-w-0 flex flex-col"
        style={{ maxWidth: 620, background: CARD, borderRight: `1px solid ${LINE}`, height: "100vh" }}
      >
        <div className="sticky top-0 z-10 px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${LINE}`, background: "var(--eight-header-bg)" }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link href="/messages" style={{ fontSize: 13, color: BLUE, textDecoration: "none" }}>
                ← Mensagens
              </Link>
              <h1 style={{ fontWeight: 800, fontSize: 18, color: INK, marginTop: 4 }}>{title}</h1>
              {isGroup ? (
                <p style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
                  <Users size={12} style={{ display: "inline", marginRight: 4 }} />
                  {participants.length} membros
                </p>
              ) : otherHandle ? (
                <Link href={`/${otherHandle}`} style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}>
                  @{otherHandle}
                </Link>
              ) : null}
            </div>
            {isGroup && (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setShowManageGroup(true)}
                  disabled={pending}
                  title="Gerenciar grupo"
                  style={{ color: MUTED, background: "none", border: "none", cursor: "pointer", padding: 4 }}
                >
                  <Settings size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMembers(true)}
                  disabled={pending}
                  title="Adicionar membros"
                  style={{ color: BLUE, background: "none", border: "none", cursor: "pointer", padding: 4 }}
                >
                  <UserPlus size={18} />
                </button>
                <button
                  type="button"
                  onClick={onLeaveGroup}
                  disabled={pending}
                  title="Sair do grupo"
                  style={{ color: ORANGE, background: "none", border: "none", cursor: "pointer", padding: 4 }}
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
          {isGroup && (
            <p className="mt-2 truncate" style={{ fontSize: 12, color: MUTED }}>
              {participants.map((p) => `@${p.handle}`).join(", ")}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <p className="text-center py-8" style={{ color: MUTED, fontSize: 14 }}>
              {isGroup ? "Envie a primeira mensagem no grupo." : `Inicie a conversa com ${title}.`}
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`mb-3 flex ${m.isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[85%] px-4 py-2.5 rounded-2xl"
                style={{
                  background: m.isMine ? BLUE : "var(--eight-bubble-incoming)",
                  color: m.isMine ? "#fff" : INK,
                  borderBottomRightRadius: m.isMine ? 4 : undefined,
                  borderBottomLeftRadius: m.isMine ? undefined : 4,
                }}
              >
                {isGroup && !m.isMine && m.senderName && (
                  <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, opacity: 0.85 }}>
                    {m.senderName}
                  </p>
                )}
                {m.imageUrl && (
                  <a href={m.imageUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={m.imageUrl}
                      alt=""
                      className="rounded-xl mb-2 max-w-full"
                      style={{ maxHeight: 280, objectFit: "cover" }}
                    />
                  </a>
                )}
                {m.body.trim() && (
                  <p style={{ fontSize: 15, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>{m.body}</p>
                )}
                <p
                  style={{
                    fontSize: 11,
                    marginTop: 4,
                    opacity: 0.75,
                    textAlign: "right",
                  }}
                >
                  {formatMessageTime(new Date(m.createdAt))}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 px-4 py-3 border-t" style={{ borderColor: LINE, background: CARD }}>
          {error && <p className="signup-error mb-2">{error}</p>}
          {imageUrl && (
            <div className="relative inline-block mb-2">
              <img src={imageUrl} alt="" className="h-20 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="absolute -top-1 -right-1 rounded-full bg-black/70 text-white p-0.5"
                style={{ border: "none", cursor: "pointer" }}
              >
                <X size={12} />
              </button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || pending}
              className="p-2 rounded-full shrink-0"
              style={{ color: BLUE, background: "transparent", border: "none", cursor: "pointer" }}
              title="Enviar imagem"
            >
              {uploading ? <Loader2 size={22} className="spin" /> : <ImageIcon size={22} />}
            </button>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Escreva uma mensagem…"
              rows={2}
              className="flex-1 border rounded-xl p-3 outline-none resize-none"
              style={{ borderColor: LINE, fontSize: 15 }}
              maxLength={DM_MAX_LENGTH}
            />
            <button
              type="button"
              onClick={send}
              disabled={pending || uploading || (!text.trim() && !imageUrl)}
              className="rounded-full px-5 font-bold text-white self-end shrink-0"
              style={{
                background: ORANGE,
                border: "none",
                cursor: "pointer",
                height: 44,
                opacity: text.trim() || imageUrl ? 1 : 0.5,
              }}
            >
              {pending ? "…" : "Enviar"}
            </button>
          </div>
        </div>
      </main>
    </FeedShell>
  );
}
