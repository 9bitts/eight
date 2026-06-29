export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

export function formatSpec(
  specialty: string | null | undefined,
  registrationType: string | null | undefined,
  registrationNumber: string | null | undefined
): string {
  const parts: string[] = [];
  if (specialty) parts.push(specialty);
  if (registrationType && registrationNumber) {
    parts.push(`${registrationType} · ${registrationNumber}`);
  } else if (registrationType) {
    parts.push(registrationType);
  }
  return parts.join(" · ") || "Profissional de saúde";
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")} mi`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(".0", "")} mil`;
  return String(n);
}
