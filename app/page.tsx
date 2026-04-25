import { Activity, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";

import { DisclaimerCard } from "@/components/disclaimer-card";
import { RiskAssessmentForm } from "@/components/risk-assessment-form";

const highlights = [
  {
    title: "Simple Step-by-Step Flow",
    copy: "Our easy-to-use questionnaire guides you through entering your basic health details and recent lab results.",
    icon: Activity,
  },
  {
    title: "Personalized Insights",
    copy: "Get a clear, visual summary of your potential diabetes risk factors and helpful recommendations based on your unique profile.",
    icon: Stethoscope,
  },
  {
    title: "Secure & Private",
    copy: "Your health data is processed securely and is never shared. Your privacy is our top priority.",
    icon: ShieldCheck,
  },
  {
    title: "Comprehensive View",
    copy: "The assessment looks at how your different health factors work together to give you a complete picture of your wellness.",
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
            Secure & private health screening
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            DiaVision | Diabetes risk predictor
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            This tool helps you understand your potential risk for developing diabetes. By answering a few simple questions about your health, you'll receive personalized insights to help you make informed lifestyle choices.
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
          <DisclaimerCard body="Important Notice: This tool is designed to help you understand your health and is for educational purposes only. It does not provide a formal medical diagnosis and should never replace professional advice, testing, or treatment from your doctor." />
        </div>

        <RiskAssessmentForm />
      </section>
    </main>
  );
}