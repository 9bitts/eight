"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FeedShell } from "@/components/feed/FeedShell";
import { sendDirectMessage } from "@/lib/actions/messages";
import { formatMessageTime, type ChatMessage } from "@/lib/messages";
import type { SessionUser } from "@/lib/types";

const INK = "#0c2b36";
const LINE = "#e4ebee";
const BLUE = "#176a88";
const ORANGE = "#e05930";

export function ConversationClient({
  user,
  notificationCount,
  conversationId,
  otherName,
  otherHandle,
  initialMessages,
}: {
  user: SessionUser;
  notificationCount: number;
  conversationId: string;
  otherName: string;
  otherHandle: string;
  initialMessages: ChatMessage[];
}) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const body = text.trim();
    if (!body || pending) return;
    setError("");
    startTransition(async () => {
      try {
        await sendDirectMessage(conversationId, body);
        setText("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao enviar");
      }
    });
  };

  return (
    <FeedShell user={user} notificationCount={notificationCount}>
      <main
        className="flex-1 min-w-0 flex flex-col"
        style={{ maxWidth: 620, background: "#fff", borderRight: `1px solid ${LINE}`, height: "100vh" }}
      >
        <div className="sticky top-0 z-10 px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${LINE}`, background: "#fff" }}>
          <Link href="/messages" style={{ fontSize: 13, color: BLUE, textDecoration: "none" }}>
            ← Mensagens
          </Link>
          <h1 style={{ fontWeight: 800, fontSize: 18, color: INK, marginTop: 4 }}>{otherName}</h1>
          <Link href={`/${otherHandle}`} style={{ fontSize: 13, color: "#7a8f97", textDecoration: "none" }}>
            @{otherHandle}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <p className="text-center py-8" style={{ color: "#7a8f97", fontSize: 14 }}>
              Inicie a conversa com {otherName}.
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
                  background: m.isMine ? BLUE : "#eef3f5",
                  color: m.isMine ? "#fff" : INK,
                  borderBottomRightRadius: m.isMine ? 4 : undefined,
                  borderBottomLeftRadius: m.isMine ? undefined : 4,
                }}
              >
                <p style={{ fontSize: 15, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>{m.body}</p>
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

        <div className="shrink-0 px-4 py-3 border-t" style={{ borderColor: LINE, background: "#fff" }}>
          {error && <p className="signup-error mb-2">{error}</p>}
          <div className="flex gap-2">
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
              maxLength={2000}
            />
            <button
              type="button"
              onClick={send}
              disabled={pending || !text.trim()}
              className="rounded-full px-5 font-bold text-white self-end"
              style={{
                background: ORANGE,
                border: "none",
                cursor: "pointer",
                height: 44,
                opacity: text.trim() ? 1 : 0.5,
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
