const HANDLE_RE = /^[a-z][a-z0-9_]{2,14}$/;

export function normalizeHandle(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@/, "");
}

export function isValidHandle(handle: string): boolean {
  return HANDLE_RE.test(handle);
}

export function handleError(handle: string): string | null {
  if (!handle) return "Escolha um nome de usuário.";
  if (handle.length < 3) return "Mínimo de 3 caracteres.";
  if (handle.length > 15) return "Máximo de 15 caracteres.";
  if (!HANDLE_RE.test(handle)) {
    return "Use apenas letras minúsculas, números e _. Deve começar com letra.";
  }
  return null;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function passwordError(password: string): string | null {
  if (password.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  return null;
}
