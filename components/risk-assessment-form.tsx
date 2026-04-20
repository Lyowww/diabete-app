"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  HeartPulse,
  LoaderCircle,
  MoonStar,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ResultCard } from "@/components/result-card";
import { cn } from "@/lib/utils";
import { riskAssessmentSchema, type RiskFormValues } from "@/lib/validation";
import type { PredictionResult } from "@/types/prediction";

type StepField = keyof RiskFormValues;

type WizardStep = {
  id: "welcome" | "profile" | "history" | "lifestyle" | "review" | "result";
  label: string;
  shortLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  fields?: readonly StepField[];
};

type DropdownOption<T extends string> = {
  value: T;
  label: string;
};

const DEFAULT_VALUES: RiskFormValues = {
  age: 42,
  biologicalSex: "female",
  bmi: 27.5,
  familyHistory: false,
  hypertension: false,
  activityLevel: "moderate",
  glucoseHistory: "normal",
  smokingStatus: "never",
  sleepHours: 7,
  gestationalDiabetes: false,
};

const wizardSteps: readonly WizardStep[] = [
  {
    id: "welcome",
    label: "Welcome",
    shortLabel: "Start",
    eyebrow: "Step 1",
    title: "A more guided screening journey",
    description:
      "We now collect answers across several short pages so the experience feels easier on mobile and more intentional for first-time users.",
  },
  {
    id: "profile",
    label: "Baseline profile",
    shortLabel: "Profile",
    eyebrow: "Step 2",
    title: "Start with the baseline numbers",
    description:
      "Use your best recent estimate for age, BMI, biological sex, and sleep. These are common inputs for diabetes risk models.",
    fields: ["age", "biologicalSex", "bmi", "sleepHours"],
  },
  {
    id: "history",
    label: "Health history",
    shortLabel: "History",
    eyebrow: "Step 3",
    title: "Capture the strongest medical signals",
    description:
      "Family history, blood sugar history, blood pressure, and pregnancy-related history are among the most important screening factors.",
    fields: ["glucoseHistory", "familyHistory", "hypertension", "gestationalDiabetes"],
  },
  {
    id: "lifestyle",
    label: "Daily habits",
    shortLabel: "Lifestyle",
    eyebrow: "Step 4",
    title: "Add the habits that shape metabolic risk",
    description:
      "These answers influence the overall risk estimate and help produce more realistic, behavior-focused recommendations.",
    fields: ["activityLevel", "smokingStatus"],
  },
  {
    id: "review",
    label: "Review",
    shortLabel: "Review",
    eyebrow: "Step 5",
    title: "Review before calculating your result",
    description:
      "Check the summary, then generate the final result page. The prediction request is sent only after this step.",
  },
  {
    id: "result",
    label: "Result",
    shortLabel: "Result",
    eyebrow: "Step 6",
    title: "Your final screening snapshot",
    description:
      "The last page is designed around a visual risk gauge so users can understand the outcome at a glance.",
  },
];

const reviewStepIndex = wizardSteps.findIndex((step) => step.id === "review");
const resultStepIndex = wizardSteps.findIndex((step) => step.id === "result");

const fieldToStep: Record<StepField, number> = {
  age: 1,
  biologicalSex: 1,
  bmi: 1,
  sleepHours: 1,
  glucoseHistory: 2,
  familyHistory: 2,
  hypertension: 2,
  gestationalDiabetes: 2,
  activityLevel: 3,
  smokingStatus: 3,
};

const biologicalSexOptions: readonly DropdownOption<RiskFormValues["biologicalSex"]>[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "another", label: "Intersex or another variation" },
];

const glucoseHistoryOptions: readonly DropdownOption<RiskFormValues["glucoseHistory"]>[] = [
  { value: "normal", label: "No known abnormal result" },
  { value: "borderline", label: "Borderline / prediabetes range" },
  { value: "high", label: "High / diabetes range" },
];

const activityLevelOptions: readonly DropdownOption<RiskFormValues["activityLevel"]>[] = [
  { value: "low", label: "Mostly sedentary" },
  { value: "moderate", label: "Some routine activity" },
  { value: "high", label: "Consistently active" },
];

const smokingStatusOptions: readonly DropdownOption<RiskFormValues["smokingStatus"]>[] = [
  { value: "never", label: "Never smoked" },
  { value: "former", label: "Former smoker" },
  { value: "current", label: "Current smoker" },
];

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

function formatBoolean(value: boolean) {
  return value ? "Yes" : "No";
}

function formatBiologicalSex(value: RiskFormValues["biologicalSex"]) {
  if (value === "female") {
    return "Female";
  }

  if (value === "male") {
    return "Male";
  }

  return "Intersex or another variation";
}

function formatActivityLevel(value: RiskFormValues["activityLevel"]) {
  if (value === "high") {
    return "Consistently active";
  }

  if (value === "moderate") {
    return "Some routine activity";
  }

  return "Mostly sedentary";
}

function formatGlucoseHistory(value: RiskFormValues["glucoseHistory"]) {
  if (value === "high") {
    return "High or diabetes-range result";
  }

  if (value === "borderline") {
    return "Borderline or prediabetes-range result";
  }

  return "No known abnormal result";
}

function formatSmokingStatus(value: RiskFormValues["smokingStatus"]) {
  if (value === "current") {
    return "Current smoker";
  }

  if (value === "former") {
    return "Former smoker";
  }

  return "Never smoked";
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

function CustomDropdown<T extends string>({
  id,
  invalid = false,
  onChange,
  options,
  value,
}: {
  id: string;
  invalid?: boolean;
  onChange: (value: T) => void;
  options: readonly DropdownOption<T>[];
  value: T;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [highlightedIndex, setHighlightedIndex] = useState(selectedIndex);
  const selectedOption = options[selectedIndex] ?? options[0];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const selectOption = (nextValue: T) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!isOpen) {
        setHighlightedIndex(selectedIndex);
        setIsOpen(true);
        return;
      }

      setHighlightedIndex((index) => Math.min(index + 1, options.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!isOpen) {
        setHighlightedIndex(selectedIndex);
        setIsOpen(true);
        return;
      }

      setHighlightedIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (!isOpen) {
        setHighlightedIndex(selectedIndex);
        setIsOpen(true);
        return;
      }

      const option = options[highlightedIndex];

      if (option) {
        selectOption(option.value);
      }
    }
  };

  return (
    <div className="relative mt-2" ref={rootRef}>
      <button
        aria-controls={`${id}-listbox`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-2xl border bg-slate-950/60 px-4 text-left text-base text-white outline-none transition",
          invalid
            ? "border-rose-400/50 focus:ring-2 focus:ring-rose-400/20"
            : "border-white/10 hover:border-cyan-300/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20",
          isOpen ? "border-cyan-300/60 ring-2 ring-cyan-300/20" : "",
        )}
        id={id}
        onClick={() => {
          if (!isOpen) {
            setHighlightedIndex(selectedIndex);
          }

          setIsOpen((open) => !open);
        }}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", isOpen ? "rotate-180" : "")}
        />
      </button>

      {isOpen ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-[0_20px_60px_rgba(2,6,23,0.45)] backdrop-blur"
          id={`${id}-listbox`}
          role="listbox"
        >
          <div className="grid gap-1">
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <button
                  aria-selected={isSelected}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-left text-sm transition",
                    isSelected
                      ? "bg-cyan-300 text-slate-950"
                      : isHighlighted
                        ? "bg-white/10 text-white"
                        : "text-slate-200 hover:bg-white/10",
                  )}
                  key={option.value}
                  onClick={() => selectOption(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  role="option"
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BooleanField({
  checked,
  description,
  disabled = false,
  label,
  name,
  onChange,
}: {
  checked: boolean;
  description: string;
  disabled?: boolean;
  label: string;
  name: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex h-full items-start gap-3 rounded-3xl border border-white/10 bg-slate-950/45 p-4 transition",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-cyan-300/30 hover:bg-slate-950/60",
      )}
    >
      <span
        className={cn(
          "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-slate-950 transition",
          checked ? "border-cyan-300 bg-cyan-300" : "border-white/20 bg-transparent text-transparent",
        )}
      >
        <Check className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block font-medium text-white">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-300">{description}</span>
      </span>
      <input
        checked={checked}
        className="sr-only"
        disabled={disabled}
        name={name}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

export function RiskAssessmentForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    formState: { errors, isSubmitting },
    clearErrors,
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    trigger,
  } = useForm<RiskFormValues>({
    resolver: zodResolver(riskAssessmentSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const biologicalSex = useWatch({ control, name: "biologicalSex" }) ?? DEFAULT_VALUES.biologicalSex;
  const familyHistory = useWatch({ control, name: "familyHistory" }) ?? DEFAULT_VALUES.familyHistory;
  const hypertension = useWatch({ control, name: "hypertension" }) ?? DEFAULT_VALUES.hypertension;
  const gestationalDiabetes =
    useWatch({ control, name: "gestationalDiabetes" }) ?? DEFAULT_VALUES.gestationalDiabetes;
  const gestationalDisabled = biologicalSex !== "female";
  const isReviewStep = currentStep === reviewStepIndex;
  const isResultStep = currentStep === resultStepIndex;
  const currentStepConfig = wizardSteps[currentStep];
  const progressPercent = ((currentStep + 1) / wizardSteps.length) * 100;
  const values = getValues();
  const reviewSections = [
    {
      title: "Baseline profile",
      items: [
        { label: "Age", value: `${values.age} years` },
        { label: "BMI", value: values.bmi.toFixed(1) },
        { label: "Sex at birth", value: formatBiologicalSex(values.biologicalSex) },
        { label: "Average sleep", value: `${values.sleepHours} hours` },
      ],
    },
    {
      title: "Health history",
      items: [
        { label: "Glucose history", value: formatGlucoseHistory(values.glucoseHistory) },
        { label: "Family history", value: formatBoolean(values.familyHistory) },
        { label: "Hypertension", value: formatBoolean(values.hypertension) },
        {
          label: "Gestational diabetes history",
          value:
            values.biologicalSex === "female"
              ? formatBoolean(values.gestationalDiabetes)
              : "Not applicable",
        },
      ],
    },
    {
      title: "Daily habits",
      items: [
        { label: "Activity level", value: formatActivityLevel(values.activityLevel) },
        { label: "Smoking status", value: formatSmokingStatus(values.smokingStatus) },
      ],
    },
  ];

  useEffect(() => {
    if (gestationalDisabled && gestationalDiabetes) {
      setValue("gestationalDiabetes", false, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [gestationalDiabetes, gestationalDisabled, setValue]);

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
                  title: "Page-by-page intake",
                  copy: "Shorter screens reduce drop-off and feel much better on smaller devices.",
                },
                {
                  icon: HeartPulse,
                  title: "Health-first structure",
                  copy: "The questions are grouped into profile, history, and lifestyle instead of one long wall of inputs.",
                },
                {
                  icon: Sparkles,
                  title: "Visual final result",
                  copy: "The last step now lands on a dedicated result screen with a bold gauge-style indicator.",
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
                  "Use recent values if you know them; the flow is optimized for fast completion.",
                  "Your answers stay in memory for this session and are sent only when you request a result.",
                  "If no external prediction service is configured, the app safely falls back to demo mode.",
                  "You can review every answer before the final result page is generated.",
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
                The new flow works well on phones: each step fits comfortably on-screen, and the final result is a
                dedicated visual page rather than a narrow side panel.
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
            <div>
              <label className="text-sm font-medium text-slate-200" htmlFor="age">
                Age
              </label>
              <input
                aria-invalid={Boolean(errors.age)}
                className={inputClassName}
                id="age"
                inputMode="numeric"
                placeholder="42"
                type="number"
                {...register("age", { valueAsNumber: true })}
              />
              <FieldError message={errors.age?.message} />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200" htmlFor="bmi">
                BMI
              </label>
              <input
                aria-invalid={Boolean(errors.bmi)}
                className={inputClassName}
                id="bmi"
                inputMode="decimal"
                placeholder="27.5"
                step="0.1"
                type="number"
                {...register("bmi", { valueAsNumber: true })}
              />
              <p className="mt-2 text-xs text-slate-400">
                If you do not know it, you can use a recent clinical estimate.
              </p>
              <FieldError message={errors.bmi?.message} />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200" htmlFor="biologicalSex">
                Sex at birth
              </label>
              <Controller
                control={control}
                name="biologicalSex"
                render={({ field }) => (
                  <CustomDropdown
                    id="biologicalSex"
                    invalid={Boolean(errors.biologicalSex)}
                    onChange={field.onChange}
                    options={biologicalSexOptions}
                    value={field.value}
                  />
                )}
              />
              <p className="mt-2 text-xs text-slate-400">
                Included because some clinical models and external APIs require it.
              </p>
              <FieldError message={errors.biologicalSex?.message} />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200" htmlFor="sleepHours">
                Average sleep each night
              </label>
              <input
                aria-invalid={Boolean(errors.sleepHours)}
                className={inputClassName}
                id="sleepHours"
                inputMode="decimal"
                placeholder="7"
                step="0.5"
                type="number"
                {...register("sleepHours", { valueAsNumber: true })}
              />
              <FieldError message={errors.sleepHours?.message} />
            </div>
          </div>
        </StepCard>
      );
    }

    if (currentStepConfig.id === "history") {
      return (
        <StepCard
          description={currentStepConfig.description}
          eyebrow={currentStepConfig.eyebrow}
          title={currentStepConfig.title}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="glucoseHistory">
                Previous glucose or HbA1c result
              </label>
              <Controller
                control={control}
                name="glucoseHistory"
                render={({ field }) => (
                  <CustomDropdown
                    id="glucoseHistory"
                    invalid={Boolean(errors.glucoseHistory)}
                    onChange={field.onChange}
                    options={glucoseHistoryOptions}
                    value={field.value}
                  />
                )}
              />
              <FieldError message={errors.glucoseHistory?.message} />
            </div>

            <div className="grid gap-4">
              <BooleanField
                checked={familyHistory}
                description="A parent or sibling has been diagnosed with diabetes."
                label="Family history of diabetes"
                name="familyHistory"
                onChange={(checked) =>
                  setValue("familyHistory", checked, { shouldDirty: true, shouldValidate: true })
                }
              />
              <FieldError message={errors.familyHistory?.message} />
            </div>

            <div className="grid gap-4">
              <BooleanField
                checked={hypertension}
                description="You currently have high blood pressure or take medication for it."
                label="Hypertension"
                name="hypertension"
                onChange={(checked) =>
                  setValue("hypertension", checked, { shouldDirty: true, shouldValidate: true })
                }
              />
              <FieldError message={errors.hypertension?.message} />
            </div>

            <div className="grid gap-4 md:col-span-2">
              <BooleanField
                checked={gestationalDiabetes}
                description="Only mark this if you have had gestational diabetes in a previous pregnancy."
                disabled={gestationalDisabled}
                label="History of gestational diabetes"
                name="gestationalDiabetes"
                onChange={(checked) =>
                  setValue("gestationalDiabetes", checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
              <p className="text-xs text-slate-400">
                {biologicalSex === "female"
                  ? "Only answer yes if this pregnancy-related history applies."
                  : "Disabled automatically when pregnancy-related history does not apply."}
              </p>
              <FieldError message={errors.gestationalDiabetes?.message} />
            </div>
          </div>
        </StepCard>
      );
    }

    if (currentStepConfig.id === "lifestyle") {
      return (
        <StepCard
          description={currentStepConfig.description}
          eyebrow={currentStepConfig.eyebrow}
          title={currentStepConfig.title}
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-200" htmlFor="activityLevel">
                  Typical weekly activity
                </label>
                <Controller
                  control={control}
                  name="activityLevel"
                  render={({ field }) => (
                    <CustomDropdown
                      id="activityLevel"
                      invalid={Boolean(errors.activityLevel)}
                      onChange={field.onChange}
                      options={activityLevelOptions}
                      value={field.value}
                    />
                  )}
                />
                <FieldError message={errors.activityLevel?.message} />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-200" htmlFor="smokingStatus">
                  Smoking status
                </label>
                <Controller
                  control={control}
                  name="smokingStatus"
                  render={({ field }) => (
                    <CustomDropdown
                      id="smokingStatus"
                      invalid={Boolean(errors.smokingStatus)}
                      onChange={field.onChange}
                      options={smokingStatusOptions}
                      value={field.value}
                    />
                  )}
                />
                <FieldError message={errors.smokingStatus?.message} />
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: MoonStar,
                  title: "Short step, useful signal",
                  copy: "Lifestyle details make the final result more actionable, even when the external predictor is simple.",
                },
                {
                  icon: ShieldCheck,
                  title: "Still privacy-conscious",
                  copy: "No answers are stored by this frontend. The browser only sends them when you request the result page.",
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
                    "The validated answers are sent to the server-side prediction route.",
                    "If your external predictor is configured, that route calls it securely with environment-based auth.",
                    "The final result opens as a full-page visual step with a gauge-inspired design.",
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
                This is the only step that sends data. Until you submit, everything remains local to the form.
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
                    {isComplete ? <Check className="h-4 w-4" /> : index + 1}
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
                Jump back to the review step to update answers, or reset the full wizard and start again.
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
                  ? "Ready to render the dedicated result page."
                  : "Move through the pages in order for a smoother mobile-friendly intake flow."}
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
                  {isSubmitting ? "Designing result page" : "Show my result"}
                </button>
              ) : (
                <button
                  className={primaryButtonClassName}
                  disabled={isSubmitting}
                  onClick={handleAdvance}
                  type="button"
                >
                  {currentStep === 0 ? "Start assessment" : currentStep === 3 ? "Review answers" : "Continue"}
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
