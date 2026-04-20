import { Activity, ArrowRight, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";

import { RiskGauge } from "@/components/risk-gauge";
import { cn, formatPercent } from "@/lib/utils";
import type { PredictionResult, RiskLevel } from "@/types/prediction";

const riskPalette: Record<
  RiskLevel,
  {
    badge: string;
    title: string;
  }
> = {
  low: {
    badge: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20",
    title: "Lower current risk profile",
  },
  moderate: {
    badge: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20",
    title: "Moderate current risk profile",
  },
  high: {
    badge: "bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/20",
    title: "Higher current risk profile",
  },
};

type ResultCardProps = {
  result: PredictionResult | null;
  isLoading: boolean;
  error: string | null;
};

function Placeholder() {
  return (
    <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-3 text-cyan-200">
        <Sparkles className="h-5 w-5" />
        <p className="font-medium">Your risk snapshot will appear here.</p>
      </div>
      <p className="text-sm leading-6 text-slate-300">
        Fill out the assessment to see a probability estimate, the biggest contributors, and follow-up
        suggestions you can take into a clinical conversation.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          "Server-side prediction requests",
          "Clear risk categories and next steps",
          "Preview-safe demo mode without secrets",
          "No health answers stored in this app",
        ].map((item) => (
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
          We could not complete the assessment
        </div>
        <p className="mt-3">{error}</p>
      </div>
    );
  }

  if (!result) {
    return <Placeholder />;
  }

  const palette = riskPalette[result.riskLevel];

  return (
    <div className="space-y-6">
      <div className="rounded-[36px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-700">Final result</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {palette.title}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              This last screen is designed as a clear screening snapshot so users can understand their result
              immediately on mobile or desktop.
            </p>
          </div>
          <span className={cn("rounded-full px-3 py-1 text-sm font-medium", palette.badge)}>
            {result.riskLevel}
          </span>
        </div>

        <div className="mt-6">
          <RiskGauge probability={result.probability} riskLevel={result.riskLevel} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Probability</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              {formatPercent(result.probability)}
            </p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Confidence</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              {formatPercent(result.confidence)}
            </p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Score</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              {result.score.toFixed(0)}
              <span className="ml-1 text-base font-medium text-slate-500">/ {result.maxScore.toFixed(0)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)]">
        <div className="space-y-4">
          <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
            <div className="flex items-center gap-2 text-cyan-700">
              <Activity className="h-5 w-5" />
              <p className="font-medium">Clinical-style summary</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">{result.summary}</p>
          </div>

          <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
            <div className="flex items-center gap-2 text-cyan-700">
              <ArrowRight className="h-5 w-5" />
              <p className="font-medium">Recommended next steps</p>
            </div>
            <div className="mt-4 grid gap-3">
              {result.recommendedActions.map((action) => (
                <div
                  key={action}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
                >
                  {action}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
            <div className="flex items-center gap-2 text-cyan-700">
              <ShieldCheck className="h-5 w-5" />
              <p className="font-medium">Biggest contributors</p>
            </div>
            <div className="mt-4 grid gap-3">
              {result.contributors.map((contributor) => (
                <div
                  key={contributor.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-slate-900">{contributor.label}</p>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                        contributor.impact === "strong"
                          ? "bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/20"
                          : contributor.impact === "elevated"
                            ? "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20"
                            : "bg-cyan-500/10 text-cyan-700 ring-1 ring-cyan-500/20",
                      )}
                    >
                      {contributor.impact}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{contributor.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-5 text-sm leading-6 text-slate-600 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
            <div className="flex items-center gap-2 text-cyan-700">
              <Sparkles className="h-5 w-5" />
              <p className="font-medium">Provider details</p>
            </div>
            <p className="mt-3">
              <span className="font-medium text-slate-900">Provider:</span> {result.provider}
            </p>
            <p className="mt-2">{result.disclaimer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
