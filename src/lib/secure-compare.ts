import { timingSafeEqual } from "crypto";

/** Comparação de segredos resistente a timing attacks. */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
