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
    title: "Metabolic Risk Assessment System",
    description:
      "This application evaluates the joint risk of metabolic complications using Logistic Regression and Copula theory to support clinical decision-making.",
  },
  {
    id: "profile",
    label: "Core profile",
    shortLabel: "Profile",
    eyebrow: "Step 2",
    title: "Patient Biometrics & History",
    description:
      "Begin by inputting primary demographic and biometric parameters. These form the baseline of the regression model.",
    fields: ["age", "pregnancies", "bmi"],
  },
  {
    id: "labs",
    label: "Lab values",
    shortLabel: "Labs",
    eyebrow: "Step 3",
    title: "Clinical Laboratory Results",
    description:
      "Input the patient's recent glucose and blood pressure metrics, which serve as critical independent variables for the algorithm.",
    fields: ["glucose", "bloodPressure"],
  },
  {
    id: "measurements",
    label: "Additional inputs",
    shortLabel: "More",
    eyebrow: "Step 4",
    title: "Advanced Clinical Metrics",
    description:
      "Complete the dataset with skin fold thickness, insulin levels, and genetic predisposition (pedigree function) to maximize model accuracy.",
    fields: ["skinThickness", "insulin", "diabetesPedigreeFunction"],
  },
  {
    id: "review",
    label: "Review",
    shortLabel: "Review",
    eyebrow: "Step 5",
    title: "Verify Clinical Data",
    description:
      "Ensure all entered variables are accurate. The system will securely process these inputs through the joint distribution model.",
  },
  {
    id: "result",
    label: "Result",
    shortLabel: "Result",
    eyebrow: "Step 6",
    title: "Risk Assessment Output",
    description:
      "View the calculated marginal probabilities and the Copula-based joint risk of developing metabolic complications.",
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
                  title: "Machine Learning Driven",
                  copy: "Utilizes precise clinical parameters rather than generic lifestyle proxies to fuel a customized Logistic Regression model.",
                },
                {
                  icon: FlaskConical,
                  title: "Robust Data Processing",
                  copy: "Intelligently handles missing values (e.g., zero for insulin) by imputing median statistics from the clinical training set.",
                },
                {
                  icon: Activity,
                  title: "Copula-Based Joint Risk",
                  copy: "Evaluates the mathematical dependency between complications (e.g., synergy between BMI and glucose) to prevent risk underestimation.",
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
                  "Utilize the most recent laboratory and biometric measurements available for optimal accuracy.",
                  "For the pregnancy count metric, enter 0 if it is not applicable.",
                  "Unknown clinical values (such as insulin) can be entered as 0; the model will apply statistical median imputation.",
                  "The diabetes pedigree function evaluates genetic predisposition based on clinical history.",
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
                This tool is designed as a Clinical Decision Support System (CDSS) for research purposes. It should be used as an educational screening reference, not a formal diagnosis.
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
              description="The source dataset is calibrated for adult clinical data."
              error={errors.age?.message}
              id="age"
              inputMode="numeric"
              label="Age"
              placeholder="33"
              register={register}
            />
            <MetricField
              description="Enter 0 if not applicable."
              error={errors.pregnancies?.message}
              id="pregnancies"
              inputMode="numeric"
              label="Pregnancy count"
              placeholder="2"
              register={register}
            />
            <MetricField
              description="Body Mass Index (BMI) is a primary risk coefficient in the embedded algorithm."
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
              <h3 className="mt-4 text-lg font-semibold text-white">Clinical Relevance</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Age, BMI, and baseline history are heavily weighted coefficients in the underlying logistic regression matrices.
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
              description="Input a recent fasting or clinical reading."
              error={errors.glucose?.message}
              id="glucose"
              label="Glucose (mg/dL)"
              placeholder="117"
              register={register}
            />
            <MetricField
              description="Input systolic blood pressure in mmHg."
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
                description="Enter 0 if unknown; the algorithm will apply median imputation."
                error={errors.skinThickness?.message}
                id="skinThickness"
                label="Skin thickness (mm)"
                placeholder="29"
                register={register}
              />
              <MetricField
                description="Enter 0 if unknown; the algorithm will apply median imputation."
                error={errors.insulin?.message}
                id="insulin"
                label="Insulin"
                placeholder="125"
                register={register}
              />
              <div className="md:col-span-2">
                <MetricField
                  description="A genetic predisposition metric. Typical clinical values fall between 0.1 and 1.5."
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
                  title: "Automated Imputation",
                  copy: "Missing physiological values are gracefully handled using median substitution to ensure uninterrupted algorithm execution.",
                },
                {
                  icon: Sparkles,
                  title: "Synergistic Output",
                  copy: "The backend calculates independent probabilities and evaluates their joint Copula distributions for superior predictive accuracy.",
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
                    "The system will validate your clinical inputs against the expected algorithmic parameters.",
                    "The data is processed through the logistic regression model to calculate independent marginal probabilities.",
                    "Copula functions are applied to determine the joint risk, generating the final personalized clinical insights.",
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
                Important: This algorithm serves as an educational screening aid. Elevated risk scores must be confirmed via formal laboratory testing and clinical consultation.
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
              <p className="text-lg font-semibold text-white">Need to adjust clinical metrics?</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Jump back to the review step to modify the patient data, or reset the wizard for a new assessment.
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
                  ? "Ready to process the data through the Machine Learning and Copula models."
                  : "Proceed sequentially to ensure the mathematical model receives the correct input vector."}
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
                  {isSubmitting ? "Processing data" : "Calculate Joint Risk"}
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