import Link from "next/link";
import { BadgeCheck, Clock, XCircle } from "lucide-react";
import type { SessionUser } from "@/lib/types";

const BLUE = "#176a88";
const ORANGE = "#e05930";
const INK = "var(--eight-ink)";
const MUTED = "var(--eight-muted)";

export function VerificationBanner({ user }: { user: SessionUser }) {
  if (user.verificationStatus === "VERIFIED") return null;

  const isRejected = user.verificationStatus === "REJECTED";
  const Icon = isRejected ? XCircle : Clock;
  const bg = isRejected ? "rgba(224,89,48,.12)" : "rgba(240,215,138,.15)";
  const border = isRejected ? "rgba(224,89,48,.35)" : "rgba(240,215,138,.4)";
  const color = isRejected ? ORANGE : "#c9a000";

  return (
    <Link
      href="/verificacao"
      className="flex items-center gap-3 mx-4 mt-3 mb-1 px-4 py-3 rounded-xl border"
      style={{ background: bg, borderColor: border, textDecoration: "none" }}
    >
      <Icon size={20} style={{ color, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <div style={{ fontWeight: 700, fontSize: 14, color: INK }}>
          {isRejected ? "Verificação recusada — corrija e reenvie" : "Selo pendente — complete sua verificação"}
        </div>
        <div style={{ fontSize: 12.5, color: MUTED }}>
          Toque para ver status e enviar documento
        </div>
      </div>
      <BadgeCheck size={22} style={{ color: BLUE, flexShrink: 0 }} />
    </Link>
  );
}
