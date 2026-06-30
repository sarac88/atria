export interface IllustrationProps {
  name?: "learning" | "empty-classes" | "empty-submissions" | "empty-messages" | "done";
  size?: number;
}

/** Flat, brand-coloured line illustrations (navy + warm yellow, no gradients). */
export function Illustration({ name = "learning", size = 200 }: IllustrationProps) {
  const navy = "var(--brand-primary)";
  const yellow = "var(--brand-accent)";
  const soft = "var(--brand-secondary)";
  const props = { width: size, height: size, viewBox: "0 0 200 200", fill: "none", role: "img" as const };
  const sw = 5;
  const common = { stroke: navy, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (name === "learning") {
    const cream = "#FBF7EF";
    const soft2 = "#AAC1EC";
    const soft3 = "#86A6DE";
    const navy2 = "#16244A";
    const ln = { stroke: navy2, strokeWidth: 4.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
    const vein = { stroke: navy2, strokeWidth: 2, strokeLinecap: "round" as const, fill: "none" };
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" fill="none" role="img">
        <circle cx={26} cy={48} r={4} fill={yellow} />
        <circle cx={181} cy={142} r={6} fill={soft2} />
        <circle cx={173} cy={30} r={3} fill={cream} />
        <circle cx={34} cy={166} r={2.6} fill={yellow} />
        <path d="M104 22C142 18 178 44 184 86C190 128 168 166 128 180C92 192 50 182 28 150C8 122 8 80 28 52C46 28 76 25 104 22Z" fill={cream} />
        <circle cx={150} cy={58} r={15} fill={yellow} />
        <path d="M150 33v-7M173 58h7M167 41l5-5M167 75l5 5" stroke={yellow} strokeWidth={4} strokeLinecap="round" />
        <path d="M99 132C95 116 104 105 100 91C98 83 101 75 100 66" {...ln} />
        <path d="M99 117C84 117 74 107 75 92C90 93 100 104 99 117Z" {...ln} />
        <path d="M84 95C90 102 95 109 99 116" {...vein} />
        <path d="M100 103C115 101 126 91 125 76C110 78 100 90 100 103Z" {...ln} />
        <path d="M118 85C112 92 106 98 100 103" {...vein} />
        <path d="M100 88C90 86 83 78 85 67C96 69 101 78 100 88Z" {...ln} />
        <circle cx={100} cy={62} r={6} {...ln} />
        <path d="M36 152C60 144 82 146 100 152C118 146 140 144 164 152L160 167C138 160 118 162 100 167C82 162 62 160 40 167Z" {...ln} />
        <path d="M45 151C51 129 74 123 99 131L99 153C80 147 63 148 50 154Z" {...ln} />
        <path d="M155 151C149 129 126 123 99 131L99 153C118 147 137 148 150 154Z" {...ln} />
        <path d="M59 138C68 134 80 134 90 138M110 138C120 134 132 134 141 138" stroke={soft3} strokeWidth={2.4} strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "empty-classes") {
    return (
      <svg {...props}>
        <circle cx={100} cy={100} r={78} fill="var(--surface-soft)" />
        <rect x={50} y={70} width={100} height={70} rx={10} fill="#fff" {...common} />
        <path d="M50 84h100" {...common} />
        <path d="M62 64h26l8 8h32a6 6 0 0 1 6 6" fill={soft} {...common} />
        <path d="M100 100v22M89 111h22" stroke={yellow} strokeWidth={sw} strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "empty-submissions") {
    return (
      <svg {...props}>
        <circle cx={100} cy={100} r={78} fill="var(--surface-soft)" />
        <path d="M52 96 64 60h72l12 36v40a6 6 0 0 1-6 6H58a6 6 0 0 1-6-6V96Z" fill="#fff" {...common} />
        <path d="M52 96h28l6 12h28l6-12h28" fill={soft} {...common} />
        <path d="M100 44v26m-11-11 11 11 11-11" stroke={yellow} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "empty-messages") {
    return (
      <svg {...props}>
        <circle cx={100} cy={100} r={78} fill="var(--surface-soft)" />
        <path d="M52 72h96a8 8 0 0 1 8 8v44a8 8 0 0 1-8 8H92l-22 18v-18H52a8 8 0 0 1-8-8V80a8 8 0 0 1 8-8Z" fill="#fff" {...common} />
        <path d="M70 96h60M70 112h38" stroke={soft} strokeWidth={sw} strokeLinecap="round" />
        <circle cx={140} cy={66} r={12} fill={yellow} stroke={navy} strokeWidth={sw} />
      </svg>
    );
  }
  if (name === "done") {
    return (
      <svg {...props}>
        <circle cx={100} cy={100} r={60} fill={soft} stroke={navy} strokeWidth={sw} />
        <path d="M78 100l16 16 30-34" stroke={yellow} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return null;
}
