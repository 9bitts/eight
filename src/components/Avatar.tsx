import { avatarColor, initials } from "@/lib/avatar";

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: avatarColor(name),
        color: "#fff",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
      }}
    >
      {initials(name)}
    </div>
  );
}
