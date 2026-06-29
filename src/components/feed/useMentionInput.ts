"use client";

import { useEffect, useRef, useState } from "react";
import {
  getMentionQuery,
  insertMention,
  type MentionOption,
} from "@/components/feed/MentionSuggestions";

export function useMentionInput(initial = "") {
  const [text, setText] = useState(initial);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionOptions, setMentionOptions] = useState<MentionOption[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mentionQuery === null || mentionQuery.length < 1) {
      setMentionOptions([]);
      return;
    }
    const id = setTimeout(() => {
      fetch(`/api/mentions?q=${encodeURIComponent(mentionQuery)}`)
        .then((r) => r.json())
        .then((data) => setMentionOptions(Array.isArray(data) ? data : []))
        .catch(() => setMentionOptions([]));
    }, 200);
    return () => clearTimeout(id);
  }, [mentionQuery]);

  const onTextChange = (value: string, cursor: number) => {
    setText(value);
    setMentionQuery(getMentionQuery(value, cursor));
  };

  const selectMention = (handle: string) => {
    const el = textareaRef.current;
    const cursor = el?.selectionStart ?? text.length;
    const { text: next, cursor: newCursor } = insertMention(text, cursor, handle);
    setText(next);
    setMentionQuery(null);
    setMentionOptions([]);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(newCursor, newCursor);
    });
  };

  return {
    text,
    setText,
    textareaRef,
    mentionQuery,
    mentionOptions,
    onTextChange,
    selectMention,
  };
}
