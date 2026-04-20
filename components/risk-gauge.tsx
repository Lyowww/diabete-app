import { cn, formatPercent } from "@/lib/utils";
import type { RiskLevel } from "@/types/prediction";

type RiskGaugeProps = {
  probability: number;
  riskLevel: RiskLevel;
};

const arcColors = [
  "#84cc16",
  "#9fd232",
  "#b7d84a",
  "#cfd15a",
  "#e0c84d",
  "#eabf45",
  "#f0b347",
  "#eea13f",
  "#eb8f3b",
  "#e57a36",
  "#e66235",
  "#e34e31",
  "#df3f31",
  "#dc2626",
] as const;

const riskTone: Record<
  RiskLevel,
  {
    badge: string;
    label: string;
  }
> = {
  low: {
    badge: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20",
    label: "Low risk",
  },
  moderate: {
    badge: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20",
    label: "Middle risk",
  },
  high: {
    badge: "bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/20",
    label: "High risk",
  },
};

function pointOnArc(centerX: number, centerY: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY - radius * Math.sin(radians),
  };
}

function describeArc(centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) {
  const start = pointOnArc(centerX, centerY, radius, startAngle);
  const end = pointOnArc(centerX, centerY, radius, endAngle);
  const largeArcFlag = Math.abs(startAngle - endAngle) > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export function RiskGauge({ probability, riskLevel }: RiskGaugeProps) {
  const clampedProbability = Math.min(1, Math.max(0, probability));
  const centerX = 180;
  const centerY = 170;
  const arcRadius = 118;
  const sweepPerSegment = 180 / arcColors.length;
  const gap = 2.2;
  const angle = 180 - clampedProbability * 180;
  const radians = (angle * Math.PI) / 180;
  const direction = {
    x: Math.cos(radians),
    y: -Math.sin(radians),
  };
  const perpendicular = {
    x: -direction.y,
    y: direction.x,
  };
  const tip = {
    x: centerX + direction.x * 110,
    y: centerY + direction.y * 110,
  };
  const leftBase = {
    x: centerX + perpendicular.x * 11,
    y: centerY + perpendicular.y * 11,
  };
  const rightBase = {
    x: centerX - perpendicular.x * 11,
    y: centerY - perpendicular.y * 11,
  };
  const tone = riskTone[riskLevel];

  return (
    <div className="relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-[radial-gradient(circle_at_top,#ffffff_0%,#f8fafc_48%,#e5e7eb_100%)] px-4 pb-8 pt-5 shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:px-6 sm:pt-6">
      <div className="absolute bottom-4 left-[58%] h-48 w-32 -translate-x-1/2 rotate-[45deg] rounded-full bg-black/10 blur-2xl" />
      <div className="absolute bottom-5 left-1/2 h-24 w-56 -translate-x-1/2 rounded-full bg-black/12 blur-3xl" />

      <div className="pointer-events-none absolute left-4 top-[54%] text-2xl font-semibold text-slate-700 sm:left-7 sm:text-[3rem]">
        Low
      </div>
      <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 text-2xl font-semibold text-slate-700 sm:text-[3rem]">
        Middle
      </div>
      <div className="pointer-events-none absolute right-4 top-[54%] text-2xl font-semibold text-slate-700 sm:right-7 sm:text-[3rem]">
        High
      </div>

      <svg
        aria-hidden="true"
        className="relative z-[1] mx-auto block w-full max-w-[520px]"
        viewBox="0 0 360 260"
      >
        {arcColors.map((color, index) => {
          const startAngle = 180 - index * sweepPerSegment - gap / 2;
          const endAngle = 180 - (index + 1) * sweepPerSegment + gap / 2;

          return (
            <path
              key={`${color}-${index}`}
              d={describeArc(centerX, centerY, arcRadius, startAngle, endAngle)}
              fill="none"
              stroke={color}
              strokeLinecap="round"
              strokeWidth="16"
            />
          );
        })}

        <polygon
          fill="#4b5563"
          opacity="0.92"
          points={`${leftBase.x},${leftBase.y} ${tip.x},${tip.y} ${rightBase.x},${rightBase.y}`}
        />
        <circle cx={centerX} cy={centerY} fill="#52525b" r="16" />
        <circle cx={centerX} cy={centerY} fill="#d4d4d8" r="7" />
      </svg>

      <div className="absolute left-1/2 top-[61%] z-[2] flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[radial-gradient(circle_at_32%_24%,#2f2f35_0%,#19191d_45%,#09090b_100%)] shadow-[0_24px_50px_rgba(0,0,0,0.4)] ring-8 ring-black/10 sm:h-44 sm:w-44">
        <div className="text-center text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/55 sm:text-xs">
            Estimated
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight sm:text-5xl">
            {formatPercent(clampedProbability)}
          </p>
          <p className="mt-2 text-xl font-semibold uppercase tracking-[0.2em] sm:text-[2.5rem]">Risk</p>
        </div>
      </div>

      <div
        className={cn(
          "absolute bottom-4 left-1/2 z-[3] -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] shadow-sm sm:text-base",
          tone.badge,
        )}
      >
        {tone.label}
      </div>
    </div>
  );
}
