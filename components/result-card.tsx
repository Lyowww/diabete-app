import { Activity, ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";

import { RiskGauge } from "@/components/risk-gauge";
import { cn, formatPercent } from "@/lib/utils";
import en from "@/locales/en.json";
import type { ContributorImpact, PredictionResult, RiskLevel } from "@/types/prediction";

const copy = en.result;
const i = copy.impact;

const riskStyle: Record<
  RiskLevel,
  {
    badge: string;
    badgeShadow: string;
    accent: string;
    glowBg: string;
  }
> = {
  low: {
    badge: "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30",
    badgeShadow: "shadow-[0_0_24px_rgba(52,211,153,0.35)]",
    accent: "text-emerald-300",
    glowBg: "rgba(52,211,153,0.07)",
  },
  moderate: {
    badge: "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30",
    badgeShadow: "shadow-[0_0_24px_rgba(251,191,36,0.35)]",
    accent: "text-amber-300",
    glowBg: "rgba(251,191,36,0.07)",
  },
  high: {
    badge: "bg-rose-400/15 text-rose-300 ring-1 ring-rose-400/30",
    badgeShadow: "shadow-[0_0_24px_rgba(251,113,133,0.35)]",
    accent: "text-rose-300",
    glowBg: "rgba(251,113,133,0.07)",
  },
};

const impactConfig: Record<ContributorImpact, { label: string; badge: string; bars: number; barColor: string }> = {
  strong: {
    label: i.strong.label,
    badge: "bg-rose-400/15 text-rose-300 ring-1 ring-rose-400/25",
    bars: 3,
    barColor: "bg-rose-400",
  },
  elevated: {
    label: i.elevated.label,
    badge: "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/25",
    bars: 2,
    barColor: "bg-amber-400",
  },
  watch: {
    label: i.watch.label,
    badge: "bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/25",
    bars: 1,
    barColor: "bg-cyan-400",
  },
};

function getRiskTitle(level: RiskLevel) {
  if (level === "low") {
    return copy.subtitles.low;
  }
  if (level === "high") {
    return copy.subtitles.high;
  }
  return copy.subtitles.moderate;
}

function ImpactBars({ impact }: { impact: ContributorImpact }) {
  const { bars, barColor } = impactConfig[impact];

  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 w-5 rounded-full transition-all",
            i <= bars ? barColor : "bg-white/10",
          )}
        />
      ))}
    </div>
  );
}

type ResultCardProps = {
  result: PredictionResult | null;
  isLoading: boolean;
  error: string | null;
};

function Placeholder() {
  return (
    <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-3 text-cyan-300">
        <Sparkles className="h-5 w-5" />
        <p className="font-medium">{copy.placeholder.title}</p>
      </div>
      <p className="text-sm leading-6 text-slate-300">
        {copy.placeholder.body}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {copy.placeholder.bullets.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6">
      <div className="h-5 w-40 animate-pulse rounded-full bg-white/10" />
      <div className="h-12 animate-pulse rounded-2xl bg-white/10" />
      <div className="h-24 animate-pulse rounded-3xl bg-white/10" />
      <div className="grid gap-3">
        <div className="h-14 animate-pulse rounded-2xl bg-white/10" />
        <div className="h-14 animate-pulse rounded-2xl bg-white/10" />
        <div className="h-14 animate-pulse rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}

export function ResultCard({ result, isLoading, error }: ResultCardProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-rose-400/25 bg-rose-500/10 p-6 text-sm leading-6 text-rose-100">
        <div className="flex items-center gap-3 font-medium">
          <Stethoscope className="h-5 w-5" />
          {copy.error.title}
        </div>
        <p className="mt-3">{error}</p>
      </div>
    );
  }

  if (!result) {
    return <Placeholder />;
  }

  const palette = riskStyle[result.riskLevel];
  const title = getRiskTitle(result.riskLevel);
  const levelName = copy.riskLevelNames[result.riskLevel];

  return (
    <div className="space-y-6">
      {/* ── Main result header card ─────────────────────────── */}
      <div className="animate-fade-in-up relative overflow-hidden rounded-[36px] border border-white/[0.08] bg-gradient-to-b from-slate-900/80 to-slate-950/95 p-5 shadow-[0_32px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-6">
        {/* Risk-level ambient glow */}
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-72 w-72 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${palette.glowBg} 0%, transparent 70%)` }}
        />
        <div
          className="pointer-events-none absolute -left-8 bottom-0 h-48 w-48 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)` }}
        />

        {/* Header row */}
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">{copy.finalEyebrow}</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              {copy.header}
            </p>
          </div>
          <span
            className={cn(
              "animate-glow-pulse rounded-full px-3.5 py-1.5 text-sm font-semibold uppercase tracking-[0.18em]",
              palette.badge,
              palette.badgeShadow,
            )}
          >
            {levelName}
          </span>
        </div>

        {/* Gauge */}
        <div className="mt-6">
          <RiskGauge
            labels={copy.gauge}
            probability={result.probability}
            riskLevel={result.riskLevel}
          />
        </div>

        
      </div>

      {/* ── Detail grid ─────────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)]">
        {/* Left column */}
        <div className="space-y-4">
          {/* Clinical summary */}
          <div className="animate-fade-in-up delay-200 rounded-[32px] border border-white/[0.08] bg-gradient-to-b from-slate-900/70 to-slate-950/80 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="flex items-center gap-2.5 text-cyan-300">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10">
                <Activity className="h-4 w-4" />
              </div>
              <p className="font-medium text-white">{copy.clinicalTitle}</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">{result.summary}</p>
          </div>

          {/* Recommended actions */}
          <div className="animate-fade-in-up delay-300 rounded-[32px] border border-white/[0.08] bg-gradient-to-b from-slate-900/70 to-slate-950/80 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10">
                <ArrowRight className="h-4 w-4 text-cyan-300" />
              </div>
              <p className="font-medium text-white">{copy.recommendationsTitle}</p>
            </div>
            <div className="mt-4 grid gap-2.5">
              {result.recommendedActions.map((action, i) => (
                <div
                  key={action}
                  className={cn(
                    "animate-slide-in-left flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-300 transition hover:border-white/[0.12] hover:bg-white/[0.03]",
                    i === 0 ? "delay-400" : i === 1 ? "delay-500" : "delay-600",
                  )}
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400/60" />
                  {action}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Contributors */}
          <div className="animate-fade-in-up delay-200 rounded-[32px] border border-white/[0.08] bg-gradient-to-b from-slate-900/70 to-slate-950/80 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10">
                <ShieldCheck className="h-4 w-4 text-cyan-300" />
              </div>
              <p className="font-medium text-white">{copy.contributorsTitle}</p>
            </div>
            <div className="mt-4 grid gap-3">
              {result.contributors.map((contributor, i) => {
                const cfg = impactConfig[contributor.impact];

                return (
                  <div
                    key={contributor.label}
                    className={cn(
                      "animate-scale-in rounded-2xl border border-white/[0.07] bg-slate-950/50 px-4 py-4 transition hover:border-white/[0.12] hover:bg-white/[0.03]",
                      i === 0 ? "delay-300" : i === 1 ? "delay-400" : "delay-500",
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-white">{contributor.label}</p>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                          cfg.badge,
                        )}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <ImpactBars impact={contributor.impact} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{contributor.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Provider details */}
          <div className="animate-fade-in-up delay-400 rounded-[32px] border border-white/[0.08] bg-gradient-to-b from-slate-900/70 to-slate-950/80 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10">
                <Sparkles className="h-4 w-4 text-cyan-300" />
              </div>
              <p className="font-medium text-white">{copy.providerTitle}</p>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              <span className="font-medium text-slate-200">{copy.providerLabel}</span> {result.provider}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{result.disclaimer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
