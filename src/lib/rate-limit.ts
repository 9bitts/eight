import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Bucket = { count: number; resetAt: number };
type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

const memoryStore = new Map<string, Bucket>();

let redis: Redis | null = null;
let warnedNoRedis = false;
const limiterCache = new Map<string, Ratelimit>();

function pruneMemoryStore(now: number) {
  if (memoryStore.size < 500) return;
  memoryStore.forEach((bucket, key) => {
    if (now >= bucket.resetAt) memoryStore.delete(key);
  });
}

function rateLimitMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  pruneMemoryStore(now);
  const bucket = memoryStore.get(key);

  if (!bucket || now >= bucket.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true };
}

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!warnedNoRedis) {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN não configurados — usando limite em memória (inadequado para múltiplas instâncias)"
      );
      warnedNoRedis = true;
    }
    return null;
  }
  if (!redis) {
    redis = new Redis({ url, token });
  }
  return redis;
}

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`;
  let limiter = limiterCache.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: getRedis()!,
      limiter: Ratelimit.fixedWindow(limit, `${windowMs} ms`),
      prefix: "eight:rl",
    });
    limiterCache.set(cacheKey, limiter);
  }
  return limiter;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const r = getRedis();
  if (!r) {
    return rateLimitMemory(key, limit, windowMs);
  }

  const { success, reset } = await getLimiter(limit, windowMs).limit(key);
  if (!success) {
    const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return { ok: false, retryAfterSec };
  }
  return { ok: true };
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const chain = forwarded
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);
    // O proxy da Railway (único hop confiável na frente do app) ANEXA a IP
    // que observou ao final da cadeia — a primeira posição é o que o
    // próprio cliente mandou no header e pode ser forjada livremente, o
    // que antes deixava o rate limit por IP inteiramente burlável.
    return chain[chain.length - 1] ?? "unknown";
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimitResponse(retryAfterSec: number) {
  return new Response(
    JSON.stringify({ error: `Muitas tentativas. Aguarde ${retryAfterSec}s.` }),
    {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(retryAfterSec) },
    }
  );
}
