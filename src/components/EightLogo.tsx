type Props = {
  variant?: "icon" | "hero";
  className?: string;
  size?: number;
};

const TEAL = "#2a90b0";
const TEAL_DARK = "#176a88";
const ORANGE = "#e05930";

export function EightLogo({ variant = "icon", className, size = 40 }: Props) {
  if (variant === "hero") {
    return (
      <svg className={className} viewBox="0 0 300 420" aria-hidden="true">
        <defs>
          <linearGradient id="eight-teal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3eb8d4" />
            <stop offset="100%" stopColor={TEAL_DARK} />
          </linearGradient>
          <linearGradient id="eight-orange" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f07a4a" />
            <stop offset="100%" stopColor={ORANGE} />
          </linearGradient>
          <filter id="eight-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Anel orbital — sensação tech */}
        <circle
          cx="150"
          cy="210"
          r="138"
          fill="none"
          stroke={TEAL}
          strokeWidth="1"
          opacity="0.18"
          strokeDasharray="6 14"
        />
        <circle
          cx="150"
          cy="210"
          r="118"
          fill="none"
          stroke={ORANGE}
          strokeWidth="0.75"
          opacity="0.12"
          strokeDasharray="3 18"
        />

        {/* Nós de rede */}
        {[
          [72, 95],
          [228, 95],
          [55, 210],
          [245, 210],
          [72, 325],
          [228, 325],
        ].map(([cx, cy], i) => (
          <g key={i} opacity="0.45">
            <line x1={cx} y1={cy} x2="150" y2="210" stroke={TEAL} strokeWidth="1" />
            <circle cx={cx} cy={cy} r="3.5" fill={i % 2 === 0 ? TEAL : ORANGE} />
          </g>
        ))}

        {/* Figura 8 — laços de saúde / conexão */}
        <ellipse
          cx="150"
          cy="128"
          rx="72"
          ry="82"
          fill="none"
          stroke="url(#eight-teal)"
          strokeWidth="5.5"
          filter="url(#eight-glow)"
        />
        <ellipse
          cx="150"
          cy="292"
          rx="72"
          ry="82"
          fill="none"
          stroke="url(#eight-orange)"
          strokeWidth="5.5"
          filter="url(#eight-glow)"
        />

        {/* Cruz médica sutil no centro */}
        <g opacity="0.22" fill="#e8f4f8">
          <rect x="146" y="198" width="8" height="24" rx="2" />
          <rect x="138" y="206" width="24" height="8" rx="2" />
        </g>

        {/* Linha de pulso / ECG */}
        <path
          className="ecg-line"
          d="M 42 210 H 88 L 104 168 L 122 252 L 138 186 L 154 234 L 170 198 L 186 222 L 202 210 H 258"
          fill="none"
          stroke={ORANGE}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.92"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="eight-icon-teal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3eb8d4" />
          <stop offset="100%" stopColor={TEAL_DARK} />
        </linearGradient>
        <linearGradient id="eight-icon-orange" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#f07a4a" />
          <stop offset="100%" stopColor={ORANGE} />
        </linearGradient>
      </defs>
      <ellipse
        cx="20"
        cy="13"
        rx="9"
        ry="10"
        fill="none"
        stroke="url(#eight-icon-teal)"
        strokeWidth="2.8"
      />
      <ellipse
        cx="20"
        cy="27"
        rx="9"
        ry="10"
        fill="none"
        stroke="url(#eight-icon-orange)"
        strokeWidth="2.8"
      />
      <path
        d="M 8 20 H 13 L 15 16 L 17 24 L 19 18 L 21 23 L 23 19 L 25 21 H 32"
        fill="none"
        stroke={ORANGE}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}
