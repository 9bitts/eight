"use client";

import { useEffect } from "react";

export function UndoToast({
  message,
  onUndo,
  onDismiss,
}: {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const id = setTimeout(onDismiss, 5000);
    return () => clearTimeout(id);
  }, [onDismiss]);

  return (
    <div
      className="fixed bottom-20 sm:bottom-6 left-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-full shadow-lg"
      style={{
        transform: "translateX(-50%)",
        background: "var(--eight-ink)",
        color: "#fff",
        fontSize: 14,
        maxWidth: "90vw",
      }}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onUndo}
        style={{
          background: "transparent",
          border: "none",
          color: "#7dd3fc",
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Desfazer
      </button>
    </div>
  );
}
