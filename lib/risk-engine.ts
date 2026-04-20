import modelParameters from "@/lib/pima-model-parameters.json";
import type {
  ContributorImpact,
  ExternalPredictionResponse,
  PredictionContributor,
  PredictionResult,
  RiskAssessmentInput,
  RiskLevel,
} from "@/types/prediction";

const DISCLAIMER =
  "This embedded model mirrors the supplied Python logistic regression trained on the Pima Indians Diabetes Dataset with a glucose/BMI copula adjustment. It is an educational screening aid, not a diagnosis, and it may generalize poorly outside the source population or when measurements are estimated.";

const FEATURE_KEYS = [
  "pregnancies",
  "glucose",
  "bloodPressure",
  "skinThickness",
  "insulin",
  "bmi",
  "diabetesPedigreeFunction",
  "age",
] as const;

const MODEL_DRIVER_KEYS = [
  "glucose",
  "bmi",
  "diabetesPedigreeFunction",
  "age",
  "pregnancies",
  "skinThickness",
] as const;

const IMPUTED_FIELDS = ["glucose", "bloodPressure", "skinThickness", "insulin", "bmi"] as const;

type FeatureKey = (typeof FEATURE_KEYS)[number];
type ModelDriverKey = (typeof MODEL_DRIVER_KEYS)[number];
type ImputedField = (typeof IMPUTED_FIELDS)[number];

type ParameterShape = {
  medians: Record<ImputedField, number>;
  scalerMean: Record<FeatureKey, number>;
  scalerScale: Record<FeatureKey, number>;
  coefficients: Record<FeatureKey, number>;
  intercept: number;
  trainAccuracy: number;
  theta: number;
};

type ContributorCandidate = {
  detail: string;
  importance: number;
  label: string;
};

type EmbeddedComputation = {
  baseProbability: number;
  finalProbability: number;
  imputedFields: ImputedField[];
  input: RiskAssessmentInput;
  synergyAdjustment: number;
};

const parameters = modelParameters as ParameterShape;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value));
}

function formatLabel(labels: string[]) {
  if (labels.length === 0) {
    return "";
  }

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(", ")}, and ${labels.at(-1)}`;
}

function getRiskLevel(probability: number): RiskLevel {
  if (probability >= 0.55) {
    return "high";
  }

  if (probability >= 0.25) {
    return "moderate";
  }

  return "low";
}

function getImpact(importance: number): ContributorImpact {
  if (importance >= 0.8) {
    return "strong";
  }

  if (importance >= 0.3) {
    return "elevated";
  }

  return "watch";
}

function normalizeInput(input: RiskAssessmentInput) {
  const imputedFields: ImputedField[] = [];

  const normalized = { ...input };

  for (const field of IMPUTED_FIELDS) {
    if (normalized[field] <= 0) {
      normalized[field] = parameters.medians[field];
      imputedFields.push(field);
    }
  }

  return { input: normalized, imputedFields };
}

function getStandardizedValue(input: RiskAssessmentInput, key: FeatureKey) {
  return (input[key] - parameters.scalerMean[key]) / parameters.scalerScale[key];
}

function frankCopulaAdjustment(u: number, v: number) {
  const theta = parameters.theta;

  if (theta === 0) {
    return u * v;
  }

  const numerator = (Math.exp(-theta * u) - 1) * (Math.exp(-theta * v) - 1);
  const denominator = Math.exp(-theta) - 1;
  return -(1 / theta) * Math.log(1 + numerator / denominator);
}

function computeEmbeddedPrediction(input: RiskAssessmentInput): EmbeddedComputation {
  const normalized = normalizeInput(input);
  const logit =
    FEATURE_KEYS.reduce(
      (total, key) =>
        total + getStandardizedValue(normalized.input, key) * parameters.coefficients[key],
      parameters.intercept,
    );
  const baseProbability = sigmoid(logit);
  const synergyAdjustment = frankCopulaAdjustment(
    clamp(normalized.input.glucose / 250, 0, 0.99),
    clamp(normalized.input.bmi / 60, 0, 0.99),
  );
  const finalProbability = clamp(baseProbability + synergyAdjustment * 0.2, 0.01, 0.99);

  return {
    input: normalized.input,
    imputedFields: normalized.imputedFields,
    baseProbability,
    finalProbability,
    synergyAdjustment,
  };
}

function buildFeatureDetail(key: ModelDriverKey, value: number) {
  if (key === "glucose") {
    return `Glucose of ${value.toFixed(0)} mg/dL sat above the model's average and was a major upward driver.`;
  }

  if (key === "bmi") {
    return `BMI of ${value.toFixed(1)} was above the training-set center and increased the estimated odds.`;
  }

  if (key === "diabetesPedigreeFunction") {
    return `A diabetes pedigree function of ${value.toFixed(2)} raised the score, reflecting a stronger family-history signal in the source dataset.`;
  }

  if (key === "age") {
    return `Age ${value.toFixed(0)} was above the model's average adult age and nudged risk higher.`;
  }

  if (key === "pregnancies") {
    return `Pregnancy count of ${value.toFixed(0)} was above the cohort average and added to the model score.`;
  }

  return `Skin thickness of ${value.toFixed(0)} mm slightly increased the score in this model.`;
}

function buildContributorCandidates({
  input,
  synergyAdjustment,
}: Pick<EmbeddedComputation, "input" | "synergyAdjustment">) {
  const candidates: ContributorCandidate[] = [];

  for (const key of MODEL_DRIVER_KEYS) {
    const contribution = getStandardizedValue(input, key) * parameters.coefficients[key];

    if (contribution <= 0.08) {
      continue;
    }

    candidates.push({
      label:
        key === "diabetesPedigreeFunction"
          ? "Diabetes pedigree function"
          : key === "skinThickness"
            ? "Skin thickness"
            : key === "bmi"
              ? "Body mass index"
              : key === "glucose"
                ? "Current glucose level"
                : key === "pregnancies"
                  ? "Pregnancy count"
                  : "Age",
      detail: buildFeatureDetail(key, input[key]),
      importance: contribution,
    });
  }

  if (synergyAdjustment >= 0.18) {
    candidates.push({
      label: "Glucose and BMI interaction",
      detail:
        "The copula adjustment boosted the result because glucose and BMI were elevated together, which the original Python model treats as a compounded risk signal.",
      importance: synergyAdjustment,
    });
  }

  candidates.sort((left, right) => right.importance - left.importance);
  return candidates;
}

function buildContributors(computation: EmbeddedComputation): PredictionContributor[] {
  const candidates = buildContributorCandidates(computation);

  if (candidates.length === 0) {
    return [
      {
        label: "Measurements stayed near model averages",
        detail:
          "Most inputs landed close to the embedded model's center values, which kept the estimated risk lower.",
        impact: "watch",
      },
    ];
  }

  return candidates.slice(0, 5).map((candidate) => ({
    label: candidate.label,
    detail: candidate.detail,
    impact: getImpact(candidate.importance),
  }));
}

function buildSummary(
  computation: EmbeddedComputation,
  riskLevel: RiskLevel,
  contributors: PredictionContributor[],
) {
  const labels = contributors
    .slice(0, 3)
    .map((contributor) => contributor.label.toLowerCase());
  const driverText =
    labels.length > 0
      ? `The strongest model drivers were ${formatLabel(labels)}.`
      : "No single measurement stood out strongly against the model averages.";
  const imputationText =
    computation.imputedFields.length > 0
      ? ` Zero values for ${formatLabel(
          computation.imputedFields.map((field) =>
            field === "bloodPressure"
              ? "blood pressure"
              : field === "skinThickness"
                ? "skin thickness"
                : field === "bmi"
                  ? "BMI"
                  : field,
          ),
        )} were treated as missing and replaced with the training-set medians, matching the original Python preprocessing.`
      : "";

  if (riskLevel === "high") {
    return `This model estimates a higher current diabetes-screening risk profile. ${driverText}${imputationText} Arrange confirmatory clinical testing soon.`;
  }

  if (riskLevel === "moderate") {
    return `This model estimates a moderate diabetes-screening risk profile. ${driverText}${imputationText} A clinician-guided follow-up plan would be reasonable.`;
  }

  return `This model estimates a lower current diabetes-screening risk profile. ${driverText}${imputationText} Keep routine screening in place as your measurements or symptoms change.`;
}

function buildRecommendedActions(computation: EmbeddedComputation, riskLevel: RiskLevel) {
  const { input } = computation;
  const actions = new Set<string>();

  if (riskLevel === "high") {
    actions.add("Arrange clinician follow-up soon and ask whether fasting glucose or HbA1c testing is appropriate.");
    actions.add("Review your weight, blood pressure, and medication picture with a clinician or dietitian.");
  } else if (riskLevel === "moderate") {
    actions.add("Discuss a repeat diabetes screening plan with your clinician in the near term.");
    actions.add("Tighten weekly activity, nutrition, and sleep habits while you confirm the result.");
  } else {
    actions.add("Keep routine preventive screening in place, especially if your measurements trend upward.");
    actions.add("Protect your current profile with regular activity, weight management, and blood pressure checks.");
  }

  if (input.glucose >= 126) {
    actions.add("Because glucose was elevated, confirm the result with formal lab testing rather than relying on a screening estimate alone.");
  } else if (input.glucose >= 100) {
    actions.add("A borderline glucose value is worth rechecking with fasting glucose or HbA1c if you have not done that recently.");
  }

  if (input.bmi >= 30) {
    actions.add("A modest reduction in weight or waist size can materially improve insulin sensitivity over time.");
  }

  if (input.bloodPressure >= 90) {
    actions.add("Monitor blood pressure closely because cardiometabolic risks often compound one another.");
  }

  if (computation.imputedFields.length > 0) {
    actions.add("Replace any zero placeholders with measured values next time to improve estimate quality.");
  }

  return Array.from(actions).slice(0, 4);
}

function normalizeContributor(candidate: Partial<PredictionContributor> | undefined) {
  if (!candidate?.label || !candidate.detail) {
    return null;
  }

  const impact = candidate.impact;

  return {
    label: candidate.label,
    detail: candidate.detail,
    impact: impact === "watch" || impact === "elevated" || impact === "strong" ? impact : "watch",
  } satisfies PredictionContributor;
}

export function buildEmbeddedPrediction(input: RiskAssessmentInput): PredictionResult {
  const computation = computeEmbeddedPrediction(input);
  const probability = computation.finalProbability;
  const riskLevel = getRiskLevel(probability);
  const contributors = buildContributors(computation);
  const confidence = clamp(
    parameters.trainAccuracy - (computation.imputedFields.length > 0 ? 0.05 : 0),
    0.55,
    0.82,
  );

  return {
    probability,
    riskLevel,
    score: Math.round(probability * 100),
    maxScore: 100,
    confidence,
    summary: buildSummary(computation, riskLevel, contributors),
    contributors,
    recommendedActions: buildRecommendedActions(computation, riskLevel),
    provider: "Embedded Pima logistic model",
    providerMode: "embedded",
    disclaimer: DISCLAIMER,
    evaluatedAt: new Date().toISOString(),
  };
}

function normalizeNumber(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return value;
}

export function normalizeExternalPrediction(
  payload: unknown,
  input: RiskAssessmentInput,
): PredictionResult {
  if (!payload || typeof payload !== "object") {
    throw new Error("Prediction payload must be an object.");
  }

  const embedded = buildEmbeddedPrediction(input);
  const response = payload as ExternalPredictionResponse;
  const responseScore = Number(response.score);
  const responseMaxScore = Number(response.maxScore);
  const rawProbability = Number(response.probability);
  const probabilityFromScore =
    Number.isFinite(responseScore) && Number.isFinite(responseMaxScore) && responseMaxScore > 0
      ? responseScore / responseMaxScore
      : Number.NaN;
  const probability = clamp(
    normalizeNumber(
      Number.isFinite(rawProbability) ? rawProbability : probabilityFromScore,
      Number.NaN,
    ),
    0,
    1,
  );

  if (!Number.isFinite(probability)) {
    throw new Error("Prediction payload did not include a usable probability or score.");
  }

  const rawRiskLevel =
    typeof response.riskLevel === "string"
      ? response.riskLevel.toLowerCase()
      : typeof response.risk_level === "string"
        ? response.risk_level.toLowerCase()
        : undefined;
  const riskLevel =
    rawRiskLevel === "low" || rawRiskLevel === "moderate" || rawRiskLevel === "high"
      ? rawRiskLevel
      : getRiskLevel(probability);
  const normalizedScore =
    Number.isFinite(responseScore) && responseScore >= 0 ? responseScore : Math.round(probability * 100);
  const normalizedMaxScore =
    Number.isFinite(responseMaxScore) && responseMaxScore > 0 ? responseMaxScore : 100;
  const confidence = clamp(Number(response.confidence), 0, 1);
  const contributors =
    response.contributors
      ?.map((candidate) => normalizeContributor(candidate))
      .filter((candidate): candidate is PredictionContributor => candidate !== null) ?? [];
  const recommendedActions =
    response.recommendedActions && response.recommendedActions.length > 0
      ? response.recommendedActions
      : response.recommended_actions && response.recommended_actions.length > 0
        ? response.recommended_actions
        : embedded.recommendedActions;

  return {
    probability,
    riskLevel,
    score: normalizedScore,
    maxScore: normalizedMaxScore,
    confidence: Number.isFinite(confidence) && confidence > 0 ? confidence : embedded.confidence,
    summary:
      typeof response.summary === "string" && response.summary.trim().length > 0
        ? response.summary
        : embedded.summary,
    contributors: contributors.length > 0 ? contributors : embedded.contributors,
    recommendedActions,
    provider:
      typeof response.provider === "string" && response.provider.trim().length > 0
        ? response.provider
        : "Configured external prediction API",
    providerMode: "external",
    disclaimer:
      typeof response.disclaimer === "string" && response.disclaimer.trim().length > 0
        ? response.disclaimer
        : embedded.disclaimer,
    evaluatedAt: new Date().toISOString(),
  };
}
