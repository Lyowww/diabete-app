export type RiskLevel = "low" | "moderate" | "high";
export type ContributorImpact = "watch" | "elevated" | "strong";
export type ProviderMode = "embedded" | "external";

export interface RiskAssessmentInput {
  pregnancies: number;
  glucose: number;
  bloodPressure: number;
  skinThickness: number;
  insulin: number;
  diabetesPedigreeFunction: number;
  age: number;
  bmi: number;
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
