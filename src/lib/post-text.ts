const HASHTAG_RE = /#([a-zA-Z0-9_\u00C0-\u024F]{2,50})/g;
const MENTION_RE = /@([a-z][a-z0-9_]{2,14})/gi;
const URL_RE = /https?:\/\/[^\s<>"']+/gi;

export function extractHashtags(text: string): string[] {
  const matches = text.match(HASHTAG_RE);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.slice(1).toLowerCase())));
}

export function extractMentions(text: string): string[] {
  const matches = text.match(MENTION_RE);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.slice(1).toLowerCase())));
}

export function extractFirstUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s<>"']+/i);
  return match ? match[0] : null;
}

export type TextPart =
  | { type: "text"; value: string }
  | { type: "hashtag"; value: string }
  | { type: "mention"; value: string }
  | { type: "url"; value: string };

export function parsePostBody(text: string): TextPart[] {
  const regex = /(https?:\/\/[^\s<>"']+)|(#([a-zA-Z0-9_\u00C0-\u024F]{2,50}))|(@([a-z][a-z0-9_]{2,14}))/gi;
  const parts: TextPart[] = [];
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) {
      parts.push({ type: "text", value: text.slice(last, m.index) });
    }
    if (m[1]) parts.push({ type: "url", value: m[1] });
    else if (m[2]) parts.push({ type: "hashtag", value: m[3].toLowerCase() });
    else if (m[4]) parts.push({ type: "mention", value: m[5].toLowerCase() });
    last = m.index + m[0].length;
  }

  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last) });
  }

  return parts.length ? parts : [{ type: "text", value: text }];
}
