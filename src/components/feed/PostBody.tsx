import Link from "next/link";
import { parsePostBody } from "@/lib/post-text";

const BLUE = "#176a88";

export function PostBody({ text }: { text: string }) {
  const parts = parsePostBody(text);

  return (
    <p style={{ color: "#1b3a45", fontSize: 15.5, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
      {parts.map((part, i) => {
        if (part.type === "hashtag") {
          return (
            <Link
              key={i}
              href={`/explore/tag/${part.value}`}
              style={{ color: BLUE, fontWeight: 600, textDecoration: "none" }}
            >
              #{part.value}
            </Link>
          );
        }
        if (part.type === "mention") {
          return (
            <Link
              key={i}
              href={`/${part.value}`}
              style={{ color: BLUE, fontWeight: 600, textDecoration: "none" }}
            >
              @{part.value}
            </Link>
          );
        }
        if (part.type === "url") {
          return (
            <a
              key={i}
              href={part.value}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: BLUE, textDecoration: "underline" }}
            >
              {part.value}
            </a>
          );
        }
        return <span key={i}>{part.value}</span>;
      })}
    </p>
  );
}
