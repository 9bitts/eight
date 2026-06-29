export const RESERVED_HANDLES = new Set([
  "feed",
  "login",
  "signup",
  "api",
  "post",
  "explore",
  "notifications",
  "messages",
  "cases",
  "settings",
  "listas",
  "agendados",
  "sobre",
  "termos",
  "privacidade",
  "regras",
  "contato",
  "como-funciona",
  "verificacao",
  "admin",
]);

export function isReservedHandle(handle: string) {
  return RESERVED_HANDLES.has(handle.toLowerCase());
}
