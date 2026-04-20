import type {
  ContributorImpact,
  ExternalPredictionResponse,
  PredictionContributor,
  PredictionResult,
  RiskAssessmentInput,
  RiskLevel,
} from "@/types/prediction";

const DEMO_DISCLAIMER =
  "This screening tool is educational and does not diagnose diabetes. Use it to guide a follow-up conversation with a licensed clinician.";

type Factor = {
  label: string;
  detail: string;
  points: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toImpact(points: number): ContributorImpact {
  if (points >= 4) {
    return "strong";
  }

  if (points >= 2) {
    return "elevated";
  }

  return "watch";
}

function getAgeFactor(age: number): Factor | null {
  if (age >= 65) {
    return {
      label: "Age 65 or older",
      detail: "Type 2 diabetes risk rises steadily with age, especially after the mid-60s.",
      points: 4,
    };
  }

  if (age >= 55) {
    return {
      label: "Age 55 to 64",
      detail: "Risk is meaningfully higher in later midlife.",
      points: 3,
    };
  }

  if (age >= 45) {
    return {
      label: "Age 45 to 54",
      detail: "Most screening guidelines become more proactive from age 45 onward.",
      points: 2,
    };
  }

  if (age >= 35) {
    return {
      label: "Age 35 to 44",
      detail: "Risk is still moderate, but screening often begins here when other factors are present.",
      points: 1,
    };
  }

  return null;
}

function getBmiFactor(bmi: number): Factor | null {
  if (bmi >= 35) {
    return {
      label: "BMI in severe obesity range",
      detail: "Higher body fat, especially around the abdomen, is strongly associated with insulin resistance.",
      points: 4,
    };
  }

  if (bmi >= 30) {
    return {
      label: "BMI in obesity range",
      detail: "Obesity materially increases type 2 diabetes risk.",
      points: 3,
    };
  }

  if (bmi >= 27) {
    return {
      label: "BMI above 27",
      detail: "Even before obesity, added weight can raise metabolic risk.",
      points: 2,
    };
  }

  if (bmi >= 25) {
    return {
      label: "BMI in overweight range",
      detail: "Being above a BMI of 25 can be one piece of a higher-risk profile.",
      points: 1,
    };
  }

  return null;
}

function getGlucoseFactor(glucoseHistory: RiskAssessmentInput["glucoseHistory"]): Factor | null {
  if (glucoseHistory === "high") {
    return {
      label: "History of high blood sugar",
      detail: "A prior diabetes-range result is one of the strongest signs that prompt medical follow-up is important.",
      points: 6,
    };
  }

  if (glucoseHistory === "borderline") {
    return {
      label: "History of borderline glucose or A1c",
      detail: "Prediabetes-range results are a major signal for future diabetes risk.",
      points: 4,
    };
  }

  return null;
}

function getLifestyleFactor(input: RiskAssessmentInput): Factor[] {
  const factors: Factor[] = [];

  if (input.activityLevel === "low") {
    factors.push({
      label: "Low activity level",
      detail: "Regular weekly movement improves insulin sensitivity and lowers overall risk.",
      points: 2,
    });
  } else if (input.activityLevel === "moderate") {
    factors.push({
      label: "Activity could be higher",
      detail: "A moderate activity routine is helpful, but many adults benefit from pushing closer to guideline targets.",
      points: 1,
    });
  }

  if (input.smokingStatus === "current") {
    factors.push({
      label: "Current smoking",
      detail: "Smoking is linked with poorer cardiometabolic health and a higher type 2 diabetes burden.",
      points: 2,
    });
  } else if (input.smokingStatus === "former") {
    factors.push({
      label: "Past smoking history",
      detail: "Former smoking is a smaller signal than current smoking, but it can still be part of the overall picture.",
      points: 1,
    });
  }

  if (input.sleepHours < 6 || input.sleepHours > 9) {
    factors.push({
      label: "Sleep outside the typical range",
      detail: "Very short or very long sleep can accompany metabolic stress and reduced recovery.",
      points: 1,
    });
  }

  return factors;
}

function buildFactors(input: RiskAssessmentInput) {
  const factors: Factor[] = [];
  const ageFactor = getAgeFactor(input.age);
  const bmiFactor = getBmiFactor(input.bmi);
  const glucoseFactor = getGlucoseFactor(input.glucoseHistory);

  if (ageFactor) {
    factors.push(ageFactor);
  }

  if (bmiFactor) {
    factors.push(bmiFactor);
  }

  if (input.familyHistory) {
    factors.push({
      label: "Family history of diabetes",
      detail: "A close relative with diabetes increases inherited and household-pattern risk.",
      points: 3,
    });
  }

  if (input.hypertension) {
    factors.push({
      label: "High blood pressure",
      detail: "Hypertension often travels with insulin resistance and cardiovascular risk.",
      points: 2,
    });
  }

  if (input.gestationalDiabetes) {
    factors.push({
      label: "History of gestational diabetes",
      detail: "Prior gestational diabetes is a strong signal for later type 2 diabetes risk.",
      points: 3,
    });
  }

  if (glucoseFactor) {
    factors.push(glucoseFactor);
  }

  factors.push(...getLifestyleFactor(input));

  return factors.sort((left, right) => right.points - left.points);
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

function formatList(labels: string[]) {
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

function buildSummary(riskLevel: RiskLevel, factors: Factor[]) {
  const topDrivers = factors.slice(0, 3).map((factor) => factor.label.toLowerCase());
  const driverText = topDrivers.length
    ? `The strongest contributors in this estimate were ${formatList(topDrivers)}.`
    : "No major single risk driver stood out from the information provided.";

  if (riskLevel === "high") {
    return `Your answers point to a higher-risk profile for type 2 diabetes screening. ${driverText} Consider arranging formal lab-based screening soon.`;
  }

  if (riskLevel === "moderate") {
    return `Your answers suggest a moderate diabetes risk profile, with a few factors worth tightening. ${driverText} A clinician-guided screening plan would be reasonable.`;
  }

  return `Your current profile trends lower risk than the average adult, though regular screening can still be appropriate based on age and history. ${driverText}`;
}

function buildRecommendedActions(riskLevel: RiskLevel, input: RiskAssessmentInput) {
  const actions = new Set<string>();

  if (riskLevel === "high") {
    actions.add("Arrange clinician follow-up soon and ask whether fasting glucose or HbA1c testing is appropriate.");
    actions.add("Review weight, blood pressure, and medication factors with a clinician or registered dietitian.");
  } else if (riskLevel === "moderate") {
    actions.add("Discuss a preventive screening plan with your clinician, especially if you are over 35 or have other risk factors.");
    actions.add("Aim for at least 150 minutes of weekly activity plus two sessions of strength work.");
  } else {
    actions.add("Keep up regular screening intervals recommended for your age and health history.");
    actions.add("Protect your current risk profile with consistent activity, sleep, and nutrition habits.");
  }

  if (input.glucoseHistory !== "normal") {
    actions.add("Because you reported prior abnormal glucose results, confirm the current picture with formal lab testing.");
  }

  if (input.hypertension) {
    actions.add("Keep blood pressure controlled, since cardiometabolic risks often compound each other.");
  }

  if (input.activityLevel !== "high") {
    actions.add("Increase steady weekly movement, especially brisk walking or similar moderate-intensity activity.");
  }

  return Array.from(actions).slice(0, 4);
}

function buildContributors(factors: Factor[]): PredictionContributor[] {
  return factors.slice(0, 5).map((factor) => ({
    label: factor.label,
    detail: factor.detail,
    impact: toImpact(factor.points),
  }));
}

function normalizeNumber(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return value;
}

export function buildMockPrediction(input: RiskAssessmentInput): PredictionResult {
  const factors = buildFactors(input);
  const score = factors.reduce((total, factor) => total + factor.points, 0);
  const maxScore = 27;
  const probability = clamp(1 / (1 + Math.exp(-((score - 10) / 3.5))), 0.03, 0.97);
  const riskLevel = getRiskLevel(probability);

  return {
    probability,
    riskLevel,
    score,
    maxScore,
    confidence: 0.72,
    summary: buildSummary(riskLevel, factors),
    contributors: buildContributors(factors),
    recommendedActions: buildRecommendedActions(riskLevel, input),
    provider: "Built-in demo predictor",
    providerMode: "demo",
    disclaimer: DEMO_DISCLAIMER,
    evaluatedAt: new Date().toISOString(),
  };
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

export function normalizeExternalPrediction(
  payload: unknown,
  input: RiskAssessmentInput,
): PredictionResult {
  if (!payload || typeof payload !== "object") {
    throw new Error("Prediction payload must be an object.");
  }

  const response = payload as ExternalPredictionResponse;
  const factors = buildFactors(input);
  const responseScore = Number(response.score);
  const responseMaxScore = Number(response.maxScore);
  const rawProbability = Number(response.probability);
  const probabilityFromScore =
    Number.isFinite(responseScore) && Number.isFinite(responseMaxScore) && responseMaxScore > 0
      ? responseScore / responseMaxScore
      : NaN;
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
        : buildRecommendedActions(riskLevel, input);

  return {
    probability,
    riskLevel,
    score: normalizedScore,
    maxScore: normalizedMaxScore,
    confidence: Number.isFinite(confidence) && confidence > 0 ? confidence : 0.82,
    summary:
      typeof response.summary === "string" && response.summary.trim().length > 0
        ? response.summary
        : buildSummary(riskLevel, factors),
    contributors: contributors.length > 0 ? contributors : buildContributors(factors),
    recommendedActions,
    provider:
      typeof response.provider === "string" && response.provider.trim().length > 0
        ? response.provider
        : "Configured external prediction API",
    providerMode: "external",
    disclaimer:
      typeof response.disclaimer === "string" && response.disclaimer.trim().length > 0
        ? response.disclaimer
        : DEMO_DISCLAIMER,
    evaluatedAt: new Date().toISOString(),
  };
}
