"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pin, Pencil, Trash2 } from "lucide-react";
import { deletePost, editPost, pinPost } from "@/lib/actions";
import { ReportDialog } from "@/components/moderation/ReportDialog";

const LINE = "var(--eight-line)";
const CARD = "var(--eight-card-bg)";
const INK = "var(--eight-ink)";

export function PostMenu({
  postId,
  isOwner,
  isPinned,
  body,
}: {
  postId: string;
  isOwner: boolean;
  isPinned: boolean;
  body: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [editText, setEditText] = useState(body);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  if (!isOwner) {
    return (
      <>
        <div className="relative ml-auto" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            style={{ color: "var(--eight-muted)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
          >
            ···
          </button>
          {open && (
            <div
              className="absolute right-0 top-8 z-20 rounded-xl shadow-lg border py-1 min-w-[160px]"
              style={{ background: CARD, borderColor: LINE }}
            >
              <button
                type="button"
                onClick={() => { setReporting(true); setOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-left"
                style={{ fontSize: 14, color: "#e05930", background: "none", border: "none", cursor: "pointer" }}
              >
                Denunciar
              </button>
            </div>
          )}
        </div>
        {reporting && (
          <ReportDialog targetType="POST" targetId={postId} onClose={() => setReporting(false)} />
        )}
      </>
    );
  }

  const onDelete = async () => {
    if (!confirm("Apagar esta publicação?")) return;
    await deletePost(postId);
    router.refresh();
  };

  const onPin = async () => {
    await pinPost(postId);
    setOpen(false);
    router.refresh();
  };

  const onSaveEdit = async () => {
    await editPost(postId, editText);
    setEditing(false);
    setOpen(false);
    router.refresh();
  };

  if (editing) {
    return (
      <div className="mt-2">
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          maxLength={500}
          rows={3}
          className="w-full border rounded-lg p-2 outline-none"
          style={{ borderColor: LINE, fontSize: 15 }}
        />
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={onSaveEdit}
            className="rounded-full px-4 py-1.5 font-bold text-white"
            style={{ background: "#176a88", border: "none", cursor: "pointer" }}
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-full px-4 py-1.5"
            style={{ border: `1px solid ${LINE}`, background: CARD, cursor: "pointer" }}
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative ml-auto" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{ color: "#9fb0b6", background: "none", border: "none", cursor: "pointer", padding: 4 }}
      >
        ···
      </button>
      {open && (
        <div
          className="absolute right-0 top-8 z-20 rounded-xl shadow-lg border py-1 min-w-[160px]"
          style={{ background: CARD, borderColor: LINE }}
        >
          <MenuBtn icon={Pencil} label="Editar" onClick={() => { setEditing(true); setOpen(false); }} />
          <MenuBtn icon={Pin} label={isPinned ? "Desafixar" : "Fixar no perfil"} onClick={onPin} />
          <MenuBtn icon={Trash2} label="Apagar" onClick={onDelete} danger />
        </div>
      )}
    </div>
  );
}

function MenuBtn({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Pin;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 w-full px-4 py-2.5 text-left"
      style={{
        fontSize: 14,
        color: danger ? "#e05930" : INK,
        background: "none",
        border: "none",
        cursor: "pointer",
      }}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
