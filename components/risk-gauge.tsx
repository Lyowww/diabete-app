"use client";

import { useEffect, useId, useRef, useState } from "react";

import { formatPercent } from "@/lib/utils";
import type { RiskLevel } from "@/types/prediction";

type RiskGaugeProps = {
  probability: number;
  riskLevel: RiskLevel;
  labels: { low: string; middle: string; high: string; riskPill: string };
};

const segmentColors = [
  "#22d3ee",
  "#2dd4bf",
  "#34d399",
  "#6ee7b7",
  "#a3e635",
  "#d9f99d",
  "#facc15",
  "#fbbf24",
  "#fb923c",
  "#f97316",
  "#fb7185",
  "#f43f5e",
] as const;

const riskTone: Record<RiskLevel, { accent: string; glow: string; pillFill: string; pillStroke: string }> = {
  low: {
    accent: "#2dd4bf",
    glow: "rgba(45,212,191,0.18)",
    pillFill: "rgba(45,212,191,0.14)",
    pillStroke: "rgba(45,212,191,0.36)",
  },
  moderate: {
    accent: "#f59e0b",
    glow: "rgba(245,158,11,0.16)",
    pillFill: "rgba(245,158,11,0.14)",
    pillStroke: "rgba(245,158,11,0.34)",
  },
  high: {
    accent: "#f43f5e",
    glow: "rgba(244,63,94,0.16)",
    pillFill: "rgba(244,63,94,0.14)",
    pillStroke: "rgba(244,63,94,0.34)",
  },
};

const CENTER_X = 210;
const CENTER_Y = 192;
const ARC_RADIUS = 114;
const HUB_RADIUS = 70;
const SEGMENT_GAP = 3.2;

function pointOnArc(cx: number, cy: number, r: number, angleDeg: number) {
  const radians = (angleDeg * Math.PI) / 180;

  return {
    x: cx + r * Math.cos(radians),
    y: cy - r * Math.sin(radians),
  };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = pointOnArc(cx, cy, r, startDeg);
  const end = pointOnArc(cx, cy, r, endDeg);
  const largeArcFlag = Math.abs(startDeg - endDeg) > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export function RiskGauge({ probability, riskLevel, labels }: RiskGaugeProps) {
  const [displayProbability, setDisplayProbability] = useState(0);
  const rafRef = useRef<number | null>(null);
  const displayProbabilityRef = useRef(0);
  const idPrefix = useId().replace(/:/g, "");

  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    const startTime = performance.now();
    const from = displayProbabilityRef.current;
    const target = Math.min(1, Math.max(0, probability));
    const duration = 1250;

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = from + (target - from) * eased;

      displayProbabilityRef.current = nextValue;
      setDisplayProbability(nextValue);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [probability]);

  const tone = riskTone[riskLevel];
  const segmentSweep = 180 / segmentColors.length;
  const angleDeg = 180 - displayProbability * 180;
  const radians = (angleDeg * Math.PI) / 180;
  const direction = {
    x: Math.cos(radians),
    y: -Math.sin(radians),
  };
  const perpendicular = {
    x: -direction.y,
    y: direction.x,
  };
  const tip = pointOnArc(CENTER_X, CENTER_Y, ARC_RADIUS - 14, angleDeg);
  const baseCenter = {
    x: CENTER_X + direction.x * 6,
    y: CENTER_Y + direction.y * 6,
  };
  const leftBase = {
    x: baseCenter.x + perpendicular.x * 24,
    y: baseCenter.y + perpendicular.y * 24,
  };
  const rightBase = {
    x: baseCenter.x - perpendicular.x * 24,
    y: baseCenter.y - perpendicular.y * 24,
  };
  const shadowOffset = { x: 10, y: 12 };

  const hubGradientId = `${idPrefix}-hub-gradient`;
  const ringGradientId = `${idPrefix}-ring-gradient`;
  const needleGradientId = `${idPrefix}-needle-gradient`;
  const blurFilterId = `${idPrefix}-blur-filter`;
  const needleShadowId = `${idPrefix}-needle-shadow`;
  const hubGlowId = `${idPrefix}-hub-glow`;

  return (
    <div className="animate-fade-in-up relative mx-auto w-full max-w-[34rem] overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16)_0%,rgba(15,23,42,0.94)_34%,rgba(2,6,23,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_60px_rgba(2,6,23,0.45)] sm:p-5">
      <div className="pointer-events-none absolute inset-x-8 top-2 h-24 rounded-full bg-cyan-300/10 blur-3xl animate-glow-pulse" />
      <div
        className="pointer-events-none absolute bottom-4 left-1/2 h-20 w-44 -translate-x-1/2 rounded-full blur-3xl animate-glow-pulse"
        style={{ background: tone.glow }}
      />

      <svg aria-hidden="true" className="relative z-[1] block w-full" viewBox="0 0 420 280">
        <defs>
          <linearGradient id={ringGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <radialGradient id={hubGradientId} cx="34%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="45%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
          <linearGradient id={needleGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="35%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <filter id={blurFilterId} x="-20%" y="-20%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <filter id={needleShadowId} x="-20%" y="-20%" width="160%" height="160%">
            <feDropShadow dx="2" dy="5" stdDeviation="5" floodColor="#020617" floodOpacity="0.4" />
          </filter>
          <filter id={hubGlowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        <ellipse
          cx="284"
          cy="232"
          rx="112"
          ry="54"
          fill="rgba(2,6,23,0.5)"
          filter={`url(#${blurFilterId})`}
          transform="rotate(37 284 232)"
        />

        <path
          d={describeArc(CENTER_X, CENTER_Y, ARC_RADIUS, 180, 0)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="22"
          strokeLinecap="butt"
        />

        {segmentColors.map((color, index) => {
          const startDeg = 180 - index * segmentSweep - SEGMENT_GAP / 2;
          const endDeg = 180 - (index + 1) * segmentSweep + SEGMENT_GAP / 2;
          const activeProgress = Math.max(0, Math.min(1, displayProbability * segmentColors.length - index));

          return (
            <g key={`${color}-${index}`}>
              <path
                d={describeArc(CENTER_X, CENTER_Y, ARC_RADIUS, startDeg, endDeg)}
                fill="none"
                opacity="0.34"
                stroke={color}
                strokeLinecap="butt"
                strokeWidth="20"
              />
              <path
                d={describeArc(CENTER_X, CENTER_Y, ARC_RADIUS, startDeg, endDeg)}
                fill="none"
                opacity={activeProgress * 0.9}
                stroke={color}
                strokeLinecap="butt"
                strokeWidth="24"
              />
              <path
                d={describeArc(CENTER_X, CENTER_Y, ARC_RADIUS, startDeg, endDeg)}
                fill="none"
                opacity={0.42 + activeProgress * 0.58}
                stroke={color}
                strokeLinecap="butt"
                strokeWidth="20"
              />
            </g>
          );
        })}

        <text fill="#cbd5e1" fontSize="28" fontWeight="700" textAnchor="end" x="74" y="194">
          {labels.low}
        </text>
        <text fill="#e2e8f0" fontSize="26" fontWeight="700" textAnchor="middle" x="210" y="50">
          {labels.middle}
        </text>
        <text fill="#cbd5e1" fontSize="28" fontWeight="700" textAnchor="start" x="346" y="194">
          {labels.high}
        </text>

        <polygon
          fill="rgba(2,6,23,0.26)"
          points={`${leftBase.x + shadowOffset.x},${leftBase.y + shadowOffset.y} ${tip.x + shadowOffset.x},${tip.y + shadowOffset.y} ${rightBase.x + shadowOffset.x},${rightBase.y + shadowOffset.y}`}
        />
        <polygon
          filter={`url(#${needleShadowId})`}
          fill={`url(#${needleGradientId})`}
          points={`${leftBase.x},${leftBase.y} ${tip.x},${tip.y} ${rightBase.x},${rightBase.y}`}
        />

        <circle cx={CENTER_X} cy={CENTER_Y} fill={tone.glow} filter={`url(#${hubGlowId})`} r={HUB_RADIUS + 24} />
        <circle cx={CENTER_X} cy={CENTER_Y} fill={`url(#${ringGradientId})`} r={HUB_RADIUS + 10} />
        <circle cx={CENTER_X} cy={CENTER_Y} fill={`url(#${hubGradientId})`} r={HUB_RADIUS} />
        <ellipse cx="190" cy="162" fill="rgba(255,255,255,0.08)" rx="42" ry="22" />
        <circle cx={CENTER_X} cy={CENTER_Y} fill="none" r={HUB_RADIUS - 2} stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />

        
        <text
          fill="#ffffff"
          fontSize="40"
          fontWeight="700"
          letterSpacing="0.4"
          textAnchor="middle"
          x={CENTER_X}
          y="192"
        >
          {formatPercent(displayProbability)}
        </text>
        <rect
          fill={tone.pillFill}
          height="24"
          rx="12"
          stroke={tone.pillStroke}
          strokeWidth="1"
          width="110"
          x={CENTER_X - 55}
          y="203"
        />
        <text fill={tone.accent} fontSize="12" fontWeight="700" letterSpacing="1" textAnchor="middle" x={CENTER_X} y="219">
          {labels.riskPill.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
