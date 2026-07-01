import { lookup } from "dns/promises";
import { isIPv4, isIPv6 } from "net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google",
]);

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fe80:")) return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("::ffff:")) {
    const v4 = normalized.slice(7);
    if (isIPv4(v4)) return isPrivateIPv4(v4);
  }
  return false;
}

function isPrivateAddress(ip: string): boolean {
  if (isIPv4(ip)) return isPrivateIPv4(ip);
  if (isIPv6(ip)) return isPrivateIPv6(ip);
  return true;
}

export async function assertSafeFetchUrl(urlString: string): Promise<URL | null> {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  ) {
    return null;
  }

  if (isIPv4(hostname) || isIPv6(hostname)) {
    if (isPrivateAddress(hostname)) return null;
    return url;
  }

  try {
    const results = await lookup(hostname, { all: true, verbatim: true });
    if (results.length === 0) return null;
    for (const { address } of results) {
      if (isPrivateAddress(address)) return null;
    }
    return url;
  } catch {
    return null;
  }
}

type SafeFetchOptions = RequestInit & {
  maxRedirects?: number;
  timeoutMs?: number;
};

export async function safeFetch(
  urlString: string,
  options: SafeFetchOptions = {}
): Promise<Response | null> {
  const { maxRedirects = 3, timeoutMs = 5000, ...init } = options;
  let current = urlString;

  for (let i = 0; i <= maxRedirects; i++) {
    const url = await assertSafeFetchUrl(current);
    if (!url) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url.toString(), {
        ...init,
        signal: controller.signal,
        redirect: "manual",
        headers: init.headers ?? { "User-Agent": "eight-bot/1.0" },
      });
      clearTimeout(timeout);

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location || i === maxRedirects) return null;
        current = new URL(location, url).toString();
        continue;
      }

      return res;
    } catch {
      clearTimeout(timeout);
      return null;
    }
  }

  return null;
}
