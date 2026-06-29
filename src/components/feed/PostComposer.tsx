"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Film,
  BarChart3,
  Calendar,
  ListPlus,
  X,
  Loader2,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { createPost } from "@/lib/actions";
import type { SessionUser } from "@/lib/types";

const BLUE = "#176a88";
const ORANGE = "#e05930";
const INK = "#0c2b36";
const LINE = "#e4ebee";

type MediaItem = { url: string; type: "image" | "video" | "gif" };

export function PostComposer({ user }: { user: SessionUser }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [threadParts, setThreadParts] = useState<string[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollHours, setPollHours] = useState(24);
  const [scheduledAt, setScheduledAt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  const charLeft = 500 - body.length;

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMedia((m) => [...m, { url: json.url, type: json.type }]);
    } catch {
      alert("Falha no upload.");
    } finally {
      setUploading(false);
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(uploadFile);
    e.target.value = "";
  };

  const publish = () => {
    const text = body.trim();
    const hasContent = text || media.length > 0 || threadParts.some((p) => p.trim());
    if (!hasContent || pending) return;

    const images = media.filter((m) => m.type === "image").map((m) => m.url);
    const video = media.find((m) => m.type === "video");
    const gif = media.find((m) => m.type === "gif");

    const poll = showPoll
      ? pollOptions.map((p) => p.trim()).filter(Boolean)
      : undefined;

    startTransition(async () => {
      await createPost({
        body: text,
        images: images.length ? images : undefined,
        videoUrl: video?.url,
        gifUrl: gif?.url,
        scheduledAt: scheduledAt || undefined,
        threadParts: threadParts.filter((p) => p.trim()),
        pollOptions: poll && poll.length >= 2 ? poll : undefined,
        pollEndsInHours: pollHours,
      });
      setBody("");
      setMedia([]);
      setThreadParts([]);
      setShowPoll(false);
      setPollOptions(["", ""]);
      setScheduledAt("");
      router.refresh();
    });
  };

  return (
    <div className="flex gap-3 px-4 py-4 border-b" style={{ borderColor: LINE }}>
      <Avatar name={user.displayName} />
      <div className="flex-1">
        <textarea
          id="composer"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="O que você está acompanhando na sua prática? Use #hashtags e @menções"
          rows={3}
          maxLength={500}
          className="w-full resize-none outline-none"
          style={{ fontSize: 17, color: INK, background: "transparent", lineHeight: 1.4 }}
        />

        {media.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {media.map((m, i) => (
              <div key={i} className="relative">
                {m.type === "video" ? (
                  <video src={m.url} className="h-20 rounded-lg" />
                ) : (
                  <img src={m.url} alt="" className="h-20 w-20 object-cover rounded-lg" />
                )}
                <button
                  type="button"
                  onClick={() => setMedia((arr) => arr.filter((_, j) => j !== i))}
                  className="absolute -top-1 -right-1 rounded-full bg-black/70 text-white p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {threadParts.map((part, i) => (
          <div key={i} className="mt-2 pl-3 border-l-2" style={{ borderColor: BLUE }}>
            <textarea
              value={part}
              onChange={(e) => {
                const next = [...threadParts];
                next[i] = e.target.value;
                setThreadParts(next);
              }}
              placeholder={`Post ${i + 2} do fio…`}
              rows={2}
              maxLength={500}
              className="w-full resize-none outline-none mt-1"
              style={{ fontSize: 15, color: INK }}
            />
          </div>
        ))}

        {showPoll && (
          <div className="mt-3 p-3 rounded-xl border" style={{ borderColor: LINE }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Enquete</p>
            {pollOptions.map((opt, i) => (
              <input
                key={i}
                value={opt}
                onChange={(e) => {
                  const next = [...pollOptions];
                  next[i] = e.target.value;
                  setPollOptions(next);
                }}
                placeholder={`Opção ${i + 1}`}
                className="w-full mb-2 px-3 py-2 rounded-lg border outline-none"
                style={{ borderColor: LINE, fontSize: 14 }}
              />
            ))}
            {pollOptions.length < 4 && (
              <button
                type="button"
                onClick={() => setPollOptions([...pollOptions, ""])}
                style={{ fontSize: 13, color: BLUE, background: "none", border: "none", cursor: "pointer" }}
              >
                + Adicionar opção
              </button>
            )}
            <select
              value={pollHours}
              onChange={(e) => setPollHours(Number(e.target.value))}
              className="mt-2 text-sm border rounded-lg px-2 py-1"
            >
              <option value={24}>1 dia</option>
              <option value={72}>3 dias</option>
              <option value={168}>7 dias</option>
            </select>
          </div>
        )}

        {scheduledAt && (
          <p style={{ fontSize: 12, color: ORANGE, marginTop: 6 }}>
            Agendado para: {new Date(scheduledAt).toLocaleString("pt-BR")}
          </p>
        )}

        <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
          <div className="flex gap-1 items-center" style={{ color: BLUE }}>
            <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm,.gif" multiple hidden onChange={onFile} />
            <IconBtn icon={ImageIcon} title="Imagem" onClick={() => fileRef.current?.click()} disabled={uploading} />
            <IconBtn icon={Film} title="Vídeo/GIF" onClick={() => fileRef.current?.click()} disabled={uploading} />
            <IconBtn icon={BarChart3} title="Enquete" onClick={() => setShowPoll(!showPoll)} active={showPoll} />
            <IconBtn
              icon={Calendar}
              title="Agendar"
              onClick={() => {
                const d = new Date(Date.now() + 3600000);
                d.setMinutes(0, 0, 0);
                const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                setScheduledAt(scheduledAt ? "" : iso);
              }}
              active={!!scheduledAt}
            />
            <IconBtn
              icon={ListPlus}
              title="Adicionar ao fio"
              onClick={() => setThreadParts([...threadParts, ""])}
            />
            {uploading && <Loader2 size={18} className="spin" />}
          </div>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 12, color: charLeft < 50 ? ORANGE : "#9fb0b6" }}>{charLeft}</span>
            <button
              type="button"
              onClick={publish}
              disabled={pending || (!body.trim() && media.length === 0)}
              className="rounded-full px-5 py-2 font-bold"
              style={{
                background: BLUE,
                color: "#fff",
                fontSize: 14.5,
                opacity: (body.trim() || media.length) && !pending ? 1 : 0.4,
                border: "none",
                cursor: "pointer",
              }}
            >
              {pending ? "…" : scheduledAt ? "Agendar" : "Publicar"}
            </button>
          </div>
        </div>

        {scheduledAt && (
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="mt-2 text-sm border rounded-lg px-2 py-1"
            style={{ borderColor: LINE }}
          />
        )}
      </div>
    </div>
  );
}

function IconBtn({
  icon: Icon,
  title,
  onClick,
  disabled,
  active,
}: {
  icon: typeof ImageIcon;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="p-1.5 rounded-full"
      style={{
        background: active ? "rgba(23,106,136,.12)" : "transparent",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        color: BLUE,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Icon size={20} />
    </button>
  );
}
