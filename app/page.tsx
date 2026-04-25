import { Activity, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";

import { DisclaimerCard } from "@/components/disclaimer-card";
import { RiskAssessmentForm } from "@/components/risk-assessment-form";

const highlights = [
  {
    title: "Precise Medical Model",
    copy: "The questionnaire collects the exact clinical risk factors and patient data required for the underlying logistic regression model to function with maximum accuracy.",
    icon: Activity,
  },
  {
    title: "Personalized Insights",
    copy: "The final screen provides a visual risk gauge, a comprehensive summary, and tailored preventive recommendations for both the patient and the healthcare provider.",
    icon: Stethoscope,
  },
  {
    title: "Machine Learning Core",
    copy: "The application relies on a robust Logistic Regression algorithm to securely calculate the independent (marginal) probabilities of individual medical complications.",
    icon: ShieldCheck,
  },
  {
    title: "Joint Risk Evaluation",
    copy: "Beyond independent probabilities, the system utilizes Copula functions to mathematically model the dependencies and simultaneous development risk of multiple complications.",
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
            Secure metabolic risk assessment
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Intelligent Risk Assessment System
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            This application calculates the joint risk of developing complications associated with metabolic syndrome and diabetes. Powered by Machine Learning and Copula theory, the algorithm provides personalized insights to support clinical decision-making.
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
          <DisclaimerCard body="Important Notice: This application was developed for research purposes and serves as a Clinical Decision Support System (CDSS). It is strictly for educational and screening purposes and does not replace a formal clinical diagnosis or treatment plan provided by a certified healthcare professional." />
        </div>

        <RiskAssessmentForm />
      </section>
    </main>
  );
}