export default function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="12.5" r="8.5" fill="none" stroke="#2a90b0" strokeWidth="3.6" />
      <circle cx="20" cy="27.5" r="8.5" fill="none" stroke="#e05930" strokeWidth="3.6" />
    </svg>
  );
}
