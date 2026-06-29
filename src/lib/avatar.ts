const AV = ["#176a88", "#e05930", "#3a8fa8", "#c8492a", "#1f7a96", "#0f4d63"];

export function avatarColor(name: string) {
  let s = 0;
  for (let i = 0; i < name.length; i++) s += name.charCodeAt(i);
  return AV[s % AV.length];
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
