import { EightLogo } from "@/components/EightLogo";

export default function Logo({ size = 30 }: { size?: number }) {
  return <EightLogo variant="icon" size={size} />;
}
