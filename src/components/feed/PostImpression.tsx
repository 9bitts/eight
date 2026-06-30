"use client";

import { useEffect, useRef } from "react";

const recorded = new Set<string>();

export function PostImpression({
  postId,
  onRecorded,
}: {
  postId: string;
  onRecorded?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (recorded.has(postId)) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (recorded.has(postId)) return;
        recorded.add(postId);

        fetch("/api/posts/views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postIds: [postId] }),
        })
          .then(() => onRecorded?.())
          .catch(() => {
            recorded.delete(postId);
          });

        observer.disconnect();
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [postId, onRecorded]);

  return <div ref={ref} className="absolute inset-0 pointer-events-none" aria-hidden />;
}
