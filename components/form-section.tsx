import type { ReactNode } from "react";

type FormSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function FormSection({ eyebrow, title, description, children }: FormSectionProps) {
  return (
    <section className="glass-card rounded-[28px] p-6 shadow-2xl shadow-slate-950/20 sm:p-7">
      <div className="mb-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">{eyebrow}</p>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}
