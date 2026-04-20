import { Activity, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";

import { DisclaimerCard } from "@/components/disclaimer-card";
import { RiskAssessmentForm } from "@/components/risk-assessment-form";

const highlights = [
  {
    title: "Model-aligned intake flow",
    copy: "The questionnaire now collects the eight measurements used by the supplied Python model instead of proxy lifestyle inputs.",
    icon: Activity,
  },
  {
    title: "Gauge-style final result",
    copy: "The last screen is a bold visual result page with a risk gauge, summary, and next-step recommendations.",
    icon: Stethoscope,
  },
  {
    title: "Embedded model fallback",
    copy: "The app can run the shared Python-model coefficients server-side even when no external prediction API is configured.",
    icon: ShieldCheck,
  },
  {
    title: "Server-side prediction adapter",
    copy: "If you later plug in a separate prediction API, the same route can forward requests without exposing secrets to the browser.",
    icon: Sparkles,
  },
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="subtle-grid pointer-events-none absolute inset-0 opacity-60" />

      <section className="relative mx-auto max-w-7xl px-6 pb-12 pt-10 sm:px-8 lg:px-10 lg:pb-16 lg:pt-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1.5 text-sm text-cyan-100">
            Secure step-by-step diabetes screening
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Diabetes risk prediction  ero powered by the supplied Python model and a guided mobile flow.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            DiaVision now walks users through the exact measurements used by the underlying Pima-based logistic model,
            then lands them on a clear gauge-style result screen with server-side prediction and room for a future
            external API.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          {highlights.map(({ copy, icon: Icon, title }) => (
            <div key={title} className="glass-card rounded-[28px] p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-16 sm:px-8 lg:px-10 lg:pb-24">
        <div className="mb-6">
          <DisclaimerCard body="This app is designed for screening support and education. It does not provide a diagnosis, emergency guidance, or a substitute for clinician-led testing." />
        </div>

        <RiskAssessmentForm />
      </section>
    </main>
  );
}
