import { BadgeCheck } from "lucide-react";

const BLUE = "#176a88";

export function VerifiedBadge({ size = 17 }: { size?: number }) {
  return (
    <BadgeCheck size={size} style={{ color: BLUE }} fill={BLUE} stroke="#fff" />
  );
}
