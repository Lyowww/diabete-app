
"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FlaskConical,
  LoaderCircle,
  RotateCcw,
  Ruler,
  Sparkles,
} from "lucide-react";
import { useForm, type DefaultValues, type Resolver, type UseFormRegister } from "react-hook-form";

import { ResultCard } from "@/components/result-card";
import { cn } from "@/lib/utils";
import { riskAssessmentSchema, type RiskFormValues } from "@/lib/validation";
import en from "@/locales/en.json";
import type { PredictionResult } from "@/types/prediction";

type StepField = keyof RiskFormValues;

type MetricWizardStep = "profile" | "labs" | "measurements";

type WizardStep = {
  id: "welcome" | "profile" | "labs" | "measurements" | "review" | "result";
  label: string;
  shortLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  fields?: readonly StepField[];
};

const t = en.form;
const w = t.wizard;
const nr = t.normalRanges;

const EMPTY_FORM_DEFAULTS: DefaultValues<RiskFormValues> = {
  pregnancies: undefined,
  glucose: undefined,
  bloodPressure: undefined,
  skinThickness: undefined,
  insulin: undefined,
  diabetesPedigreeFunction: undefined,
  age: undefined,
  bmi: undefined,
};

const wizardSteps: readonly WizardStep[] = [
  {
    id: "welcome",
    label: w.welcome.label,
    shortLabel: w.welcome.shortLabel,
    eyebrow: w.welcome.eyebrow,
    title: w.welcome.title,
    description: w.welcome.description,
  },
  {
    id: "profile",
    label: w.profile.label,
    shortLabel: w.profile.shortLabel,
    eyebrow: w.profile.eyebrow,
    title: w.profile.title,
    description: w.profile.description,
    fields: ["age", "pregnancies", "bmi"],
  },
  {
    id: "labs",
    label: w.labs.label,
    shortLabel: w.labs.shortLabel,
    eyebrow: w.labs.eyebrow,
    title: w.labs.title,
    description: w.labs.description,
    fields: ["glucose", "bloodPressure"],
  },
  {
    id: "measurements",
    label: w.measurements.label,
    shortLabel: w.measurements.shortLabel,
    eyebrow: w.measurements.eyebrow,
    title: w.measurements.title,
    description: w.measurements.description,
    fields: ["skinThickness", "insulin", "diabetesPedigreeFunction"],
  },
  {
    id: "review",
    label: w.review.label,
    shortLabel: w.review.shortLabel,
    eyebrow: w.review.eyebrow,
    title: w.review.title,
    description: w.review.description,
  },
  {
    id: "result",
    label: w.result.label,
    shortLabel: w.result.shortLabel,
    eyebrow: w.result.eyebrow,
    title: w.result.title,
    description: w.result.description,
  },
];

const fieldToStep: Record<StepField, number> = {
  age: 1,
  pregnancies: 1,
  bmi: 1,
  glucose: 2,
  bloodPressure: 2,
  skinThickness: 3,
  insulin: 3,
  diabetesPedigreeFunction: 3,
};

const reviewStepIndex = wizardSteps.findIndex((step) => step.id === "review");
const resultStepIndex = wizardSteps.findIndex((step) => step.id === "result");

const inputClassName =
  "mt-2 h-12 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20";

const primaryButtonClassName =
  "inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-70";

const secondaryButtonClassName =
  "inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white transition hover:border-cyan-300/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-60";

function scrollWizardIntoView() {
  if (typeof document === "undefined") {
    return;
  }

  document.getElementById("assessment-wizard")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-rose-200">{message}</p>;
}

function StepCard({
  children,
  description,
  eyebrow,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="glass-card min-h-[500px] rounded-[36px] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">{description}</p>
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

/**
 * Browsers group autofill by `section-*`; a different section per wizard step keeps
 * the next step’s first input from reusing the previous step’s “slot” (e.g. age → glucose).
 * Second token `off` is a valid end state per the HTML autofill model.
 */
function metricAutocompleteValue(wizardStep: MetricWizardStep, field: StepField): string {
  return `section-dm-w-${wizardStep}__${String(field).replaceAll(/[^a-z0-9]/gi, "-")} off`;
}

function MetricField({
  description,
  error,
  id,
  inputMode = "decimal",
  label,
  normalRange,
  normalRangePrefix,
  placeholder,
  register,
  step,
  wizardStep,
}: {
  description?: string;
  error?: string;
  id: StepField;
  inputMode?: "decimal" | "numeric";
  label: string;
  normalRange?: string;
  normalRangePrefix?: string;
  placeholder: string;
  register: UseFormRegister<RiskFormValues>;
  step?: number;
  wizardStep: MetricWizardStep;
}) {
  /** Isolated per field: own ref/unlock state and a distinct RHF name (`id`). */
  const [autofillUnlocked, setAutofillUnlocked] = useState(false);
  const inputId = `assessment-metric-${wizardStep}-${id}`;

  return (
    <div>
      <label className="text-sm font-medium text-slate-200" htmlFor={inputId}>
        {label}
      </label>
      <input
        aria-invalid={Boolean(error)}
        autoCapitalize="none"
        autoComplete={metricAutocompleteValue(wizardStep, id)}
        autoCorrect="off"
        className={inputClassName}
        data-1p-ignore
        data-form-type="other"
        data-lpignore="true"
        data-metric={id}
        id={inputId}
        inputMode={inputMode}
        placeholder={placeholder}
        readOnly={!autofillUnlocked}
        spellCheck={false}
        step={step}
        type="number"
        onInput={(e: FormEvent<HTMLInputElement>) => {
          if (autofillUnlocked) {
            return;
          }
          const el = e.currentTarget;
          if (el.value === "") {
            return;
          }
          setAutofillUnlocked(true);
        }}
        onPointerDownCapture={() => {
          setAutofillUnlocked(true);
        }}
        onFocus={() => {
          setAutofillUnlocked(true);
        }}
        {...register(id, { valueAsNumber: true })}
      />
      {normalRange && normalRangePrefix ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          <span className="font-medium text-slate-400">{normalRangePrefix}:</span> {normalRange}
        </p>
      ) : null}
      {description ? <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p> : null}
      <FieldError message={error} />
    </div>
  );
}

function formatReviewValue(field: StepField, value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) {
    return t.missingValue;
  }

  if (field === "bmi") {
    return value.toFixed(1);
  }

  if (field === "diabetesPedigreeFunction") {
    return value.toFixed(2);
  }

  return value.toFixed(0);
}

export function RiskAssessmentForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    clearErrors,
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
    trigger,
  } = useForm<RiskFormValues>({
    defaultValues: EMPTY_FORM_DEFAULTS,
    resolver: zodResolver(riskAssessmentSchema) as Resolver<RiskFormValues>,
    // Keep one value per field name; step views mount/unmount without merging fields.
    shouldUnregister: false,
  });

  const isReviewStep = currentStep === reviewStepIndex;
  const isResultStep = currentStep === resultStepIndex;
  const currentStepConfig = wizardSteps[currentStep];
  const progressPercent = ((currentStep + 1) / wizardSteps.length) * 100;
  const values = getValues();

  const rw = w.review;
  const reviewSections = [
    {
      title: rw.sectionAbout,
      items: [
        {
          label: rw.summaryAge,
          value: `${formatReviewValue("age", values.age)}${values.age === undefined || Number.isNaN(values.age) ? "" : ` ${rw.ageUnit}`}`,
        },
        { label: rw.summaryPregnancies, value: formatReviewValue("pregnancies", values.pregnancies) },
        { label: rw.summaryBmi, value: formatReviewValue("bmi", values.bmi) },
      ],
    },
    {
      title: rw.sectionHealth,
      items: [
        {
          label: rw.summaryGlucose,
          value:
            values.glucose === undefined || Number.isNaN(values.glucose)
              ? t.missingValue
              : `${formatReviewValue("glucose", values.glucose)} ${rw.glucoseUnit}`,
        },
        {
          label: rw.summaryBloodPressure,
          value:
            values.bloodPressure === undefined || Number.isNaN(values.bloodPressure)
              ? t.missingValue
              : `${formatReviewValue("bloodPressure", values.bloodPressure)} ${rw.bpUnit}`,
        },
      ],
    },
    {
      title: rw.sectionMore,
      items: [
        {
          label: rw.summarySkin,
          value:
            values.skinThickness === undefined || Number.isNaN(values.skinThickness)
              ? t.missingValue
              : `${formatReviewValue("skinThickness", values.skinThickness)} ${rw.skinUnit}`,
        },
        { label: rw.summaryInsulin, value: formatReviewValue("insulin", values.insulin) },
        {
          label: rw.summaryDpf,
          value: formatReviewValue("diabetesPedigreeFunction", values.diabetesPedigreeFunction),
        },
      ],
    },
  ];

  const handleAdvance = async () => {
    const fields = currentStepConfig.fields;
    const isValid = fields ? await trigger([...fields]) : true;

    if (!isValid) {
      return;
    }

    setServerError(null);
    setCurrentStep((step) => Math.min(step + 1, reviewStepIndex));
    scrollWizardIntoView();
  };

  const handleBack = () => {
    setServerError(null);
    setCurrentStep((step) => Math.max(step - 1, 0));
    scrollWizardIntoView();
  };

  const handleEditAnswers = () => {
    setResult(null);
    setServerError(null);
    setCurrentStep(reviewStepIndex);
    scrollWizardIntoView();
  };

  const handleStartOver = () => {
    reset(EMPTY_FORM_DEFAULTS);
    clearErrors();
    setResult(null);
    setServerError(null);
    setCurrentStep(0);
    scrollWizardIntoView();
  };

  const onSubmit = handleSubmit(async (submittedValues) => {
    try {
      setServerError(null);
      setResult(null);
      setCurrentStep(resultStepIndex);
      scrollWizardIntoView();

      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ input: submittedValues }),
      });

      const payload = (await response.json()) as {
        error?: string;
        fieldErrors?: Partial<Record<keyof RiskFormValues, string[] | undefined>>;
        result?: PredictionResult;
      };

      if (!response.ok || !payload.result) {
        let firstInvalidField: keyof RiskFormValues | undefined;

        if (payload.fieldErrors) {
          for (const [field, messages] of Object.entries(payload.fieldErrors)) {
            const message = messages?.[0];

            if (message) {
              firstInvalidField ??= field as keyof RiskFormValues;
              setError(field as keyof RiskFormValues, {
                type: "server",
                message,
              });
            }
          }
        }

        if (firstInvalidField) {
          setCurrentStep(fieldToStep[firstInvalidField]);
          scrollWizardIntoView();
        }

        setServerError(payload.error ?? t.errors.serverGeneric);
        return;
      }

      setResult(payload.result);
    } catch {
      setCurrentStep(resultStepIndex);
      setServerError(t.errors.connection);
    }
  });

  const renderStepContent = () => {
    if (currentStepConfig.id === "welcome") {
      const h = w.welcome;
      return (
        <StepCard
          description={currentStepConfig.description}
          eyebrow={currentStepConfig.eyebrow}
          title={currentStepConfig.title}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  icon: ClipboardList,
                  title: h.cards.quick.title,
                  copy: h.cards.quick.copy,
                },
                {
                  icon: FlaskConical,
                  title: h.cards.smart.title,
                  copy: h.cards.smart.copy,
                },
                {
                  icon: Activity,
                  title: h.cards.holistic.title,
                  copy: h.cards.holistic.copy,
                },
              ].map(({ copy, icon: Icon, title }) => (
                <div
                  key={title}
                  className="rounded-[30px] border border-white/10 bg-slate-950/45 p-5 shadow-[0_16px_40px_rgba(2,6,23,0.24)]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{copy}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[30px] border border-white/10 bg-slate-950/45 p-5 shadow-[0_16px_40px_rgba(2,6,23,0.24)]">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">{h.tipsTitle}</p>
              <div className="mt-4 grid gap-3">
                {h.tips.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm leading-6 text-cyan-50">
                {h.tipsFooter}
              </div>
            </div>
          </div>
        </StepCard>
      );
    }

    if (currentStepConfig.id === "profile") {
      const p = w.profile;
      const f = t.fields;
      const ph = t.placeholders;
      return (
        <StepCard
          description={currentStepConfig.description}
          eyebrow={currentStepConfig.eyebrow}
          title={currentStepConfig.title}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div key="age" className="contents">
              <MetricField
                description={p.ageDescription}
                error={errors.age?.message}
                id="age"
                inputMode="numeric"
                label={f.age.label}
                placeholder={ph.age}
                register={register}
                wizardStep="profile"
              />
            </div>
            <div key="pregnancies" className="contents">
              <MetricField
                description={p.pregnanciesDescription}
                error={errors.pregnancies?.message}
                id="pregnancies"
                inputMode="numeric"
                label={f.pregnancies.label}
                placeholder={ph.pregnancies}
                register={register}
                wizardStep="profile"
              />
            </div>
            <div key="bmi" className="contents">
              <MetricField
                description={p.bmiDescription}
                error={errors.bmi?.message}
                id="bmi"
                label={f.bmi.label}
                normalRange={nr.bmi}
                normalRangePrefix={nr.prefix}
                placeholder={ph.bmi}
                register={register}
                step={0.1}
                wizardStep="profile"
              />
            </div>
            <div className="rounded-[28px] border border-white/10 bg-slate-950/45 p-5 shadow-[0_16px_40px_rgba(2,6,23,0.24)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
                <Ruler className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{p.sidebarTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {p.sidebarBody}
              </p>
            </div>
          </div>
        </StepCard>
      );
    }

    if (currentStepConfig.id === "labs") {
      const l = w.labs;
      const f = t.fields;
      const ph = t.placeholders;
      return (
        <StepCard
          description={currentStepConfig.description}
          eyebrow={currentStepConfig.eyebrow}
          title={currentStepConfig.title}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div key="glucose" className="contents">
              <MetricField
                description={l.glucoseDescription}
                error={errors.glucose?.message}
                id="glucose"
                label={f.glucose.label}
                normalRange={nr.glucose}
                normalRangePrefix={nr.prefix}
                placeholder={ph.glucose}
                register={register}
                wizardStep="labs"
              />
            </div>
            <div key="bloodPressure" className="contents">
              <MetricField
                description={l.bloodPressureDescription}
                error={errors.bloodPressure?.message}
                id="bloodPressure"
                label={f.bloodPressure.label}
                normalRange={nr.bloodPressure}
                normalRangePrefix={nr.prefix}
                placeholder={ph.bloodPressure}
                register={register}
                wizardStep="labs"
              />
            </div>
          </div>
        </StepCard>
      );
    }

    if (currentStepConfig.id === "measurements") {
      const m = w.measurements;
      const f = t.fields;
      const ph = t.placeholders;
      return (
        <StepCard
          description={currentStepConfig.description}
          eyebrow={currentStepConfig.eyebrow}
          title={currentStepConfig.title}
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-5 md:grid-cols-2">
              <div key="skinThickness" className="contents">
                <MetricField
                  description={m.skinDescription}
                  error={errors.skinThickness?.message}
                  id="skinThickness"
                  label={f.skinThickness.label}
                  normalRange={nr.skinThickness}
                  normalRangePrefix={nr.prefix}
                  placeholder={ph.skinThickness}
                  register={register}
                  wizardStep="measurements"
                />
              </div>
              <div key="insulin" className="contents">
                <MetricField
                  description={m.insulinDescription}
                  error={errors.insulin?.message}
                  id="insulin"
                  label={f.insulin.label}
                  normalRange={nr.insulin}
                  normalRangePrefix={nr.prefix}
                  placeholder={ph.insulin}
                  register={register}
                  wizardStep="measurements"
                />
              </div>
              <div className="md:col-span-2" key="diabetesPedigreeFunction">
                <MetricField
                  description={m.dpfDescription}
                  error={errors.diabetesPedigreeFunction?.message}
                  id="diabetesPedigreeFunction"
                  label={f.diabetesPedigreeFunction.label}
                  placeholder={ph.diabetesPedigreeFunction}
                  register={register}
                  step={0.01}
                  wizardStep="measurements"
                />
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: FlaskConical,
                  title: m.asideMissing.title,
                  copy: m.asideMissing.copy,
                },
                {
                  icon: Sparkles,
                  title: m.asideConnecting.title,
                  copy: m.asideConnecting.copy,
                },
              ].map(({ copy, icon: Icon, title }) => (
                <div
                  key={title}
                  className="rounded-[28px] border border-white/10 bg-slate-950/45 p-5 shadow-[0_16px_40px_rgba(2,6,23,0.24)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </StepCard>
      );
    }

    if (currentStepConfig.id === "review") {
      const r = w.review;
      return (
        <StepCard
          description={currentStepConfig.description}
          eyebrow={currentStepConfig.eyebrow}
          title={currentStepConfig.title}
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-4">
              {reviewSections.map((section) => (
                <div
                  key={section.title}
                  className="rounded-[30px] border border-white/10 bg-slate-950/45 p-5 shadow-[0_16px_40px_rgba(2,6,23,0.24)]"
                >
                  <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {section.items.map((item) => (
                      <div
                        key={`${section.title}-${item.label}`}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {item.label}
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-100">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="rounded-[30px] border border-white/10 bg-slate-950/45 p-5 shadow-[0_16px_40px_rgba(2,6,23,0.24)]">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">{r.whatNext}</p>
                <div className="mt-4 grid gap-3">
                  {r.nextSteps.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-cyan-300/20 bg-cyan-300/10 px-4 py-4 text-sm leading-6 text-cyan-50 shadow-[0_16px_40px_rgba(2,6,23,0.24)]">
                {r.reviewFooter}
              </div>
            </div>
          </div>
        </StepCard>
      );
    }

    return <ResultCard error={serverError} isLoading={isSubmitting} result={result} />;
  };

  const a = t.actions;
  const pageTitle = t.pageOf
    .replace("{current}", String(currentStep + 1))
    .replace("{total}", String(wizardSteps.length))
    .replace("{label}", currentStepConfig.label);

  return (
    <div className="mx-auto max-w-6xl" id="assessment-wizard">
      <div className="glass-card rounded-[36px] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">{t.flowEyebrow}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {pageTitle}
            </h2>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
          {wizardSteps.map((step, index) => {
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <div
                key={step.id}
                className={cn(
                  "min-w-[180px] rounded-[24px] border px-4 py-3 transition",
                  isActive
                    ? "border-cyan-300/40 bg-cyan-300/10"
                    : isComplete
                      ? "border-emerald-300/20 bg-emerald-300/10"
                      : "border-white/10 bg-white/5",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      isActive
                        ? "bg-cyan-300 text-slate-950"
                        : isComplete
                          ? "bg-emerald-300 text-slate-950"
                          : "bg-white/10 text-slate-300",
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{step.shortLabel}</p>
                    <p className="truncate text-sm font-medium text-white">{step.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isResultStep ? (
        <div className="mt-6 space-y-6">
          {renderStepContent()}

          <div className="glass-card rounded-[32px] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:flex sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="text-lg font-semibold text-white">{a.resultFooterTitle}</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                {a.resultFooterBody}
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:mt-0 sm:flex-row">
              <button
                className={secondaryButtonClassName}
                disabled={isSubmitting}
                onClick={handleEditAnswers}
                type="button"
              >
                <ChevronLeft className="h-4 w-4" />
                {a.editAnswers}
              </button>
              <button
                className={primaryButtonClassName}
                disabled={isSubmitting}
                onClick={handleStartOver}
                type="button"
              >
                <RotateCcw className="h-4 w-4" />
                {a.startOver}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form autoComplete="off" className="mt-6 space-y-6" onSubmit={onSubmit}>
          <div key={currentStep}>{renderStepContent()}</div>

          {serverError ? (
            <div className="rounded-[28px] border border-rose-400/25 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100">
              {serverError}
            </div>
          ) : null}

          <div className="glass-card rounded-[32px] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:flex sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="text-lg font-semibold text-white">{currentStepConfig.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                {isReviewStep ? a.footerTitleReview : a.footerTitleProgress}
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:mt-0 sm:flex-row">
              {currentStep > 0 ? (
                <button className={secondaryButtonClassName} onClick={handleBack} type="button">
                  <ChevronLeft className="h-4 w-4" />
                  {a.back}
                </button>
              ) : null}

              {isReviewStep ? (
                <button className={primaryButtonClassName} disabled={isSubmitting} type="submit">
                  {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isSubmitting ? a.loadingResults : a.getResults}
                </button>
              ) : (
                <button
                  className={primaryButtonClassName}
                  disabled={isSubmitting}
                  onClick={handleAdvance}
                  type="button"
                >
                  {currentStep === 0
                    ? a.startAssessment
                    : currentStep + 1 === reviewStepIndex
                      ? a.reviewInputs
                      : a.continue}
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}