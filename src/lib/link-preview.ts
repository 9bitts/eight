export type LinkPreview = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
};

export async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "eight-bot/1.0" },
    });
    clearTimeout(timeout);
    if (!res.ok) return { url, title: null, description: null, image: null };

    const html = await res.text();
    const title = matchMeta(html, "og:title") ?? matchTag(html, "title");
    const description = matchMeta(html, "og:description") ?? matchMeta(html, "description");
    const image = matchMeta(html, "og:image");

    return { url, title, description, image };
  } catch {
    return { url, title: null, description: null, image: null };
  }
}

function matchMeta(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const m = html.match(re);
  if (m) return decodeHtml(m[1]);
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i"
  );
  const m2 = html.match(re2);
  return m2 ? decodeHtml(m2[1]) : null;
}

function matchTag(html: string, tag: string): string | null {
  const m = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i"));
  return m ? decodeHtml(m[1].trim()) : null;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
