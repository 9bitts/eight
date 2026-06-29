import { generateSecret, generateURI, verifySync } from "otplib";

const ISSUER = "eight Doctor8";

export function createTotpSecret(): string {
  return generateSecret();
}

export function totpKeyUri(email: string, secret: string): string {
  return generateURI({ issuer: ISSUER, label: email, secret });
}

export function verifyTotp(token: string, secret: string): boolean {
  const result = verifySync({ secret, token: token.trim() });
  return result.valid;
}
