"use client";

import { useState, type ReactNode } from "react";
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
import { useForm, type UseFormRegister } from "react-hook-form";

import { ResultCard } from "@/components/result-card";
import { cn } from "@/lib/utils";
import { riskAssessmentSchema, type RiskFormValues } from "@/lib/validation";
import type { PredictionResult } from "@/types/prediction";

type StepField = keyof RiskFormValues;

type WizardStep = {
  id: "welcome" | "profile" | "labs" | "measurements" | "review" | "result";
  label: string;
  shortLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  fields?: readonly StepField[];
};

const DEFAULT_VALUES: RiskFormValues = {
  pregnancies: 2,
  glucose: 117,
  bloodPressure: 72,
  skinThickness: 29,
  insulin: 125,
  bmi: 32.3,
  diabetesPedigreeFunction: 0.47,
  age: 33,
};

const wizardSteps: readonly WizardStep[] = [
  {
    id: "welcome",
    label: "Welcome",
    shortLabel: "Start",
    eyebrow: "Step 1",
    title: "A wizard aligned to the real model",
    description:
      "This flow now collects the exact eight measurements used by the supplied Python logistic-regression model and its glucose/BMI copula adjustment.",
  },
  {
    id: "profile",
    label: "Core profile",
    shortLabel: "Profile",
    eyebrow: "Step 2",
    title: "Start with age, BMI, and pregnancy history",
    description:
      "These are major model inputs. Pregnancy count can be 0 if it does not apply or if you have never been pregnant.",
    fields: ["age", "pregnancies", "bmi"],
  },
  {
    id: "labs",
    label: "Lab values",
    shortLabel: "Labs",
    eyebrow: "Step 3",
    title: "Add the glucose and blood-pressure measurements",
    description:
      "The original model leans heavily on recent glucose and also uses blood pressure as one of the clinical inputs.",
    fields: ["glucose", "bloodPressure"],
  },
  {
    id: "measurements",
    label: "Additional inputs",
    shortLabel: "More",
    eyebrow: "Step 4",
    title: "Complete the remaining model measurements",
    description:
      "Skin thickness, insulin, and diabetes pedigree function complete the input set. For skin thickness or insulin, a value of 0 is allowed and will be imputed to the training-set median, matching the Python preprocessing.",
    fields: ["skinThickness", "insulin", "diabetesPedigreeFunction"],
  },
  {
    id: "review",
    label: "Review",
    shortLabel: "Review",
    eyebrow: "Step 5",
    title: "Review the model inputs before prediction",
    description:
      "The server will validate these values, run the embedded version of the supplied Python model, and then render the final result page.",
  },
  {
    id: "result",
    label: "Result",
    shortLabel: "Result",
    eyebrow: "Step 6",
    title: "Your model output",
    description:
      "The final page shows the predicted probability, risk tier, and the strongest drivers produced from the Python model logic.",
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

function MetricField({
  description,
  error,
  id,
  inputMode = "decimal",
  label,
  placeholder,
  register,
  step,
}: {
  description?: string;
  error?: string;
  id: StepField;
  inputMode?: "decimal" | "numeric";
  label: string;
  placeholder: string;
  register: UseFormRegister<RiskFormValues>;
  step?: number;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-200" htmlFor={id}>
        {label}
      </label>
      <input
        aria-invalid={Boolean(error)}
        className={inputClassName}
        id={id}
        inputMode={inputMode}
        placeholder={placeholder}
        step={step}
        type="number"
        {...register(id, { valueAsNumber: true })}
      />
      {description ? <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p> : null}
      <FieldError message={error} />
    </div>
  );
}

function formatReviewValue(field: StepField, value: number) {
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
    resolver: zodResolver(riskAssessmentSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const isReviewStep = currentStep === reviewStepIndex;
  const isResultStep = currentStep === resultStepIndex;
  const currentStepConfig = wizardSteps[currentStep];
  const progressPercent = ((currentStep + 1) / wizardSteps.length) * 100;
  const values = getValues();

  const reviewSections = [
    {
      title: "Core profile",
      items: [
        { label: "Age", value: `${values.age} years` },
        { label: "Pregnancies", value: formatReviewValue("pregnancies", values.pregnancies) },
        { label: "BMI", value: formatReviewValue("bmi", values.bmi) },
      ],
    },
    {
      title: "Lab values",
      items: [
        { label: "Glucose", value: `${formatReviewValue("glucose", values.glucose)} mg/dL` },
        {
          label: "Blood pressure",
          value: `${formatReviewValue("bloodPressure", values.bloodPressure)} mmHg`,
        },
      ],
    },
    {
      title: "Additional inputs",
      items: [
        {
          label: "Skin thickness",
          value: `${formatReviewValue("skinThickness", values.skinThickness)} mm`,
        },
        { label: "Insulin", value: formatReviewValue("insulin", values.insulin) },
        {
          label: "Diabetes pedigree function",
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
    reset(DEFAULT_VALUES);
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

        setServerError(payload.error ?? "The assessment could not be completed. Please try again.");
        return;
      }

      setResult(payload.result);
    } catch {
      setCurrentStep(resultStepIndex);
      setServerError("The network request failed before a result was returned. Please try again.");
    }
  });

  const renderStepContent = () => {
    if (currentStepConfig.id === "welcome") {
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
                  title: "Exact model inputs",
                  copy: "The wizard now matches the eight features in the supplied Python file instead of using proxy lifestyle questions.",
                },
                {
                  icon: FlaskConical,
                  title: "Real preprocessing rules",
                  copy: "Zero values for skin thickness or insulin are allowed and are handled exactly like the original training pipeline.",
                },
                {
                  icon: Activity,
                  title: "Same glucose/BMI interaction",
                  copy: "The final probability still includes the copula-based synergy term from the Python model.",
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
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Before you begin</p>
              <div className="mt-4 grid gap-3">
                {[
                  "Use recent measured values when you have them, especially for glucose, BMI, and blood pressure.",
                  "Pregnancy count can be 0 if it is not relevant or you have never been pregnant.",
                  "Skin thickness and insulin can be entered as 0 when unknown; the model will replace them with the training-set medians.",
                  "Diabetes pedigree function is part of the source dataset, so this wizard exposes it directly instead of estimating it.",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm leading-6 text-cyan-50">
                The result remains educational only. This model was trained on the Pima Indians Diabetes Dataset and
                should be used as a screening reference rather than a diagnosis.
              </div>
            </div>
          </div>
        </StepCard>
      );
    }

    if (currentStepConfig.id === "profile") {
      return (
        <StepCard
          description={currentStepConfig.description}
          eyebrow={currentStepConfig.eyebrow}
          title={currentStepConfig.title}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <MetricField
              description="The source dataset contains adult participants only."
              error={errors.age?.message}
              id="age"
              inputMode="numeric"
              label="Age"
              placeholder="33"
              register={register}
            />
            <MetricField
              description="Enter 0 if not applicable or if you have never been pregnant."
              error={errors.pregnancies?.message}
              id="pregnancies"
              inputMode="numeric"
              label="Pregnancy count"
              placeholder="2"
              register={register}
            />
            <MetricField
              description="Body-mass index is one of the strongest drivers in the embedded model."
              error={errors.bmi?.message}
              id="bmi"
              label="BMI"
              placeholder="32.3"
              register={register}
              step={0.1}
            />
            <div className="rounded-[28px] border border-white/10 bg-slate-950/45 p-5 shadow-[0_16px_40px_rgba(2,6,23,0.24)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
                <Ruler className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">Why these matter</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Age, BMI, and pregnancy count are all part of the logistic regression coefficients used in the source
                Python model.
              </p>
            </div>
          </div>
        </StepCard>
      );
    }

    if (currentStepConfig.id === "labs") {
      return (
        <StepCard
          description={currentStepConfig.description}
          eyebrow={currentStepConfig.eyebrow}
          title={currentStepConfig.title}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <MetricField
              description="Use a recent fasting or clinical reading if available."
              error={errors.glucose?.message}
              id="glucose"
              label="Glucose (mg/dL)"
              placeholder="117"
              register={register}
            />
            <MetricField
              description="Use systolic blood pressure in mmHg."
              error={errors.bloodPressure?.message}
              id="bloodPressure"
              label="Blood pressure (mmHg)"
              placeholder="72"
              register={register}
            />
          </div>
        </StepCard>
      );
    }

    if (currentStepConfig.id === "measurements") {
      return (
        <StepCard
          description={currentStepConfig.description}
          eyebrow={currentStepConfig.eyebrow}
          title={currentStepConfig.title}
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-5 md:grid-cols-2">
              <MetricField
                description="Enter 0 if unknown; the predictor will use the training-set median of 29."
                error={errors.skinThickness?.message}
                id="skinThickness"
                label="Skin thickness (mm)"
                placeholder="29"
                register={register}
              />
              <MetricField
                description="Enter 0 if unknown; the predictor will use the training-set median of 125."
                error={errors.insulin?.message}
                id="insulin"
                label="Insulin"
                placeholder="125"
                register={register}
              />
              <div className="md:col-span-2">
                <MetricField
                  description="This family-history score is part of the source dataset. Typical values often fall between 0.1 and 1.5."
                  error={errors.diabetesPedigreeFunction?.message}
                  id="diabetesPedigreeFunction"
                  label="Diabetes pedigree function"
                  placeholder="0.47"
                  register={register}
                  step={0.01}
                />
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: FlaskConical,
                  title: "Median imputation supported",
                  copy: "The original Python training script replaced zeros in several fields with dataset medians. This flow keeps that behavior where it is clinically plausible.",
                },
                {
                  icon: Sparkles,
                  title: "Model-faithful output",
                  copy: "The backend now uses the learned logistic coefficients plus the same glucose/BMI synergy term instead of a generic demo score.",
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
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">What happens next</p>
                <div className="mt-4 grid gap-3">
                  {[
                    "The validated inputs are posted to the server-side prediction route.",
                    "If no external API is configured, the app uses the embedded port of your Python model and shared coefficients.",
                    "The result page shows probability, key contributors, and the same glucose/BMI interaction logic from the original script.",
                  ].map((item) => (
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
                This model remains a screening aid only. Elevated results should be confirmed with formal lab testing
                and clinician review.
              </div>
            </div>
          </div>
        </StepCard>
      );
    }

    return <ResultCard error={serverError} isLoading={isSubmitting} result={result} />;
  };

  return (
    <div className="mx-auto max-w-6xl" id="assessment-wizard">
      <div className="glass-card rounded-[36px] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Step-by-step flow</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Page {currentStep + 1} of {wizardSteps.length}: {currentStepConfig.label}
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
              <p className="text-lg font-semibold text-white">Need to change something?</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Jump back to the review step to adjust the model inputs, or reset the wizard and start again.
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
                Edit answers
              </button>
              <button
                className={primaryButtonClassName}
                disabled={isSubmitting}
                onClick={handleStartOver}
                type="button"
              >
                <RotateCcw className="h-4 w-4" />
                Start over
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form className="mt-6 space-y-6" onSubmit={onSubmit}>
          {renderStepContent()}

          {serverError ? (
            <div className="rounded-[28px] border border-rose-400/25 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100">
              {serverError}
            </div>
          ) : null}

          <div className="glass-card rounded-[32px] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:flex sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="text-lg font-semibold text-white">{currentStepConfig.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                {isReviewStep
                  ? "Ready to run the embedded model and render the final result page."
                  : "Move through the measurements in order so the final prediction uses the real model inputs."}
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:mt-0 sm:flex-row">
              {currentStep > 0 ? (
                <button className={secondaryButtonClassName} onClick={handleBack} type="button">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              ) : null}

              {isReviewStep ? (
                <button className={primaryButtonClassName} disabled={isSubmitting} type="submit">
                  {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isSubmitting ? "Running model" : "Show my result"}
                </button>
              ) : (
                <button
                  className={primaryButtonClassName}
                  disabled={isSubmitting}
                  onClick={handleAdvance}
                  type="button"
                >
                  {currentStep === 0 ? "Start assessment" : currentStep === 3 ? "Review inputs" : "Continue"}
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
