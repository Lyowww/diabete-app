export type BiologicalSex = "female" | "male" | "another";
export type ActivityLevel = "low" | "moderate" | "high";
export type GlucoseHistory = "normal" | "borderline" | "high";
export type SmokingStatus = "never" | "former" | "current";
export type RiskLevel = "low" | "moderate" | "high";
export type ContributorImpact = "watch" | "elevated" | "strong";
export type ProviderMode = "demo" | "external";

export interface RiskAssessmentInput {
  age: number;
  biologicalSex: BiologicalSex;
  bmi: number;
  familyHistory: boolean;
  hypertension: boolean;
  activityLevel: ActivityLevel;
  glucoseHistory: GlucoseHistory;
  smokingStatus: SmokingStatus;
  sleepHours: number;
  gestationalDiabetes: boolean;
}

export interface PredictionContributor {
  label: string;
  detail: string;
  impact: ContributorImpact;
}

export interface PredictionResult {
  probability: number;
  riskLevel: RiskLevel;
  score: number;
  maxScore: number;
  confidence: number;
  summary: string;
  contributors: PredictionContributor[];
  recommendedActions: string[];
  provider: string;
  providerMode: ProviderMode;
  disclaimer: string;
  evaluatedAt: string;
}

export interface PredictionRequest {
  input: RiskAssessmentInput;
}

export interface ExternalPredictionResponse {
  probability?: number | string;
  confidence?: number | string;
  score?: number | string;
  maxScore?: number | string;
  riskLevel?: RiskLevel | string;
  risk_level?: RiskLevel | string;
  summary?: string;
  contributors?: Array<Partial<PredictionContributor>>;
  recommendedActions?: string[];
  recommended_actions?: string[];
  provider?: string;
  disclaimer?: string;
}
