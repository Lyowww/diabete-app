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
    title: "Welcome to Your Health Assessment",
    description:
      "This quick questionnaire will help you understand your diabetes risk. It takes just a few minutes to complete.",
  },
  {
    id: "profile",
    label: "About You",
    shortLabel: "Profile",
    eyebrow: "Step 2",
    title: "Let's start with the basics",
    description:
      "Tell us a bit about yourself. Your age and body metrics give us a helpful starting point.",
    fields: ["age", "pregnancies", "bmi"],
  },
  {
    id: "labs",
    label: "Health Numbers",
    shortLabel: "Labs",
    eyebrow: "Step 3",
    title: "Your recent lab results",
    description:
      "Enter your latest blood sugar and blood pressure readings. These are great indicators of your current wellness.",
    fields: ["glucose", "bloodPressure"],
  },
  {
    id: "measurements",
    label: "More Details",
    shortLabel: "More",
    eyebrow: "Step 4",
    title: "Additional health details",
    description:
      "A few more details help make your results as accurate as possible. Don't worry if you don't know every single one.",
    fields: ["skinThickness", "insulin", "diabetesPedigreeFunction"],
  },
  {
    id: "review",
    label: "Review",
    shortLabel: "Review",
    eyebrow: "Step 5",
    title: "Review your answers",
    description:
      "Take a moment to check the details you've entered before we generate your personalized health insights.",
  },
  {
    id: "result",
    label: "Your Results",
    shortLabel: "Result",
    eyebrow: "Step 6",
    title: "Your Health Overview",
    description:
      "Here is a summary of your diabetes risk assessment based on the information you provided.",
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
      title: "About You",
      items: [
        { label: "Age", value: `${values.age} years` },
        { label: "Pregnancies", value: formatReviewValue("pregnancies", values.pregnancies) },
        { label: "BMI", value: formatReviewValue("bmi", values.bmi) },
      ],
    },
    {
      title: "Health Numbers",
      items: [
        { label: "Glucose", value: `${formatReviewValue("glucose", values.glucose)} mg/dL` },
        {
          label: "Blood pressure",
          value: `${formatReviewValue("bloodPressure", values.bloodPressure)} mmHg`,
        },
      ],
    },
    {
      title: "More Details",
      items: [
        {
          label: "Skin thickness",
          value: `${formatReviewValue("skinThickness", values.skinThickness)} mm`,
        },
        { label: "Insulin", value: formatReviewValue("insulin", values.insulin) },
        {
          label: "Family History Score",
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

        setServerError(payload.error ?? "We couldn't complete the assessment right now. Please try again.");
        return;
      }

      setResult(payload.result);
    } catch {
      setCurrentStep(resultStepIndex);
      setServerError("There was a connection issue. Please check your internet and try again.");
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
                  title: "Quick & Easy",
                  copy: "Answer a few straightforward questions about your health history and recent lab tests.",
                },
                {
                  icon: FlaskConical,
                  title: "Smart Analysis",
                  copy: "We'll securely analyze your numbers to give you a personalized overview of your risk profile.",
                },
                {
                  icon: Activity,
                  title: "Holistic View",
                  copy: "See how different factors like weight, age, and blood sugar work together to impact your health.",
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
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Tips for success</p>
              <div className="mt-4 grid gap-3">
                {[
                  "Have your most recent lab results handy for the best accuracy (like your blood sugar and blood pressure).",
                  "If you have never been pregnant or it doesn't apply to you, simply enter 0 for the pregnancy count.",
                  "Don't worry if you don't know your exact insulin or skin thickness levels. Just enter 0, and we'll use a standard average.",
                  "We'll ask about your family history to better understand your genetic background related to diabetes.",
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
                Remember, this tool is here to educate and inform. It is not a replacement for a doctor's visit or a formal medical diagnosis.
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
              description="Please enter your current age in years."
              error={errors.age?.message}
              id="age"
              inputMode="numeric"
              label="Age"
              placeholder="33"
              register={register}
            />
            <MetricField
              description="Enter 0 if this doesn't apply to you or if you've never been pregnant."
              error={errors.pregnancies?.message}
              id="pregnancies"
              inputMode="numeric"
              label="Pregnancy count"
              placeholder="2"
              register={register}
            />
            <MetricField
              description="Your Body Mass Index (BMI) helps us understand your overall physical profile."
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
              <h3 className="mt-4 text-lg font-semibold text-white">Why we ask for this</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Age, weight, and health history are some of the most important baseline factors when assessing diabetes risk.
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
              description="Use a recent fasting test result if you have one."
              error={errors.glucose?.message}
              id="glucose"
              label="Glucose (mg/dL)"
              placeholder="117"
              register={register}
            />
            <MetricField
              description="Enter your top (systolic) blood pressure number."
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
                description="Enter 0 if you don't know this number. We'll use a standard average."
                error={errors.skinThickness?.message}
                id="skinThickness"
                label="Skin thickness (mm)"
                placeholder="29"
                register={register}
              />
              <MetricField
                description="Enter 0 if you don't know this number. We'll use a standard average."
                error={errors.insulin?.message}
                id="insulin"
                label="Insulin"
                placeholder="125"
                register={register}
              />
              <div className="md:col-span-2">
                <MetricField
                  description="A score representing your family history of diabetes. Usually falls between 0.1 and 1.5."
                  error={errors.diabetesPedigreeFunction?.message}
                  id="diabetesPedigreeFunction"
                  label="Family History Score"
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
                  title: "Missing info? No problem",
                  copy: "If you aren't sure about some of these specific details, just enter 0. The system will fill in the gaps with safe, standard averages.",
                },
                {
                  icon: Sparkles,
                  title: "Connecting the dots",
                  copy: "By looking at all these numbers together, we can give you a much better picture of your health than looking at just one number alone.",
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
                    "We'll do a quick check to make sure your answers are ready to go.",
                    "Our system will securely review your health factors together.",
                    "You'll get a clear, easy-to-read summary of your potential diabetes risk on the next screen.",
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
                Important: These results are to help you understand your health better. Please share any concerns or questions you have with your healthcare provider.
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
              <p className="text-lg font-semibold text-white">Need to update an answer?</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Go back to the review step to fix a typo, or start over from the beginning.
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
                  ? "Whenever you're ready, let's get your personalized health insights."
                  : "Move through the steps in order to complete your assessment."}
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
                  {isSubmitting ? "Loading results" : "Get My Results"}
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