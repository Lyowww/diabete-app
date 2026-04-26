import "server-only";

import { getMongoClient, getMongoDb } from "@/lib/mongodb";
import type { PredictionResult, RiskAssessmentInput } from "@/types/prediction";

export const RISK_ASSESSMENTS_COLLECTION = "risk_assessments";

export async function persistRiskAssessment(
  input: RiskAssessmentInput,
  result: PredictionResult,
): Promise<void> {
  if (!process.env.MONGODB_URI) {
    return;
  }

  const client = getMongoClient();
  if (!client) {
    return;
  }

  try {
    await client.connect();
    const db = getMongoDb();
    if (!db) {
      return;
    }
    await db.collection(RISK_ASSESSMENTS_COLLECTION).insertOne({
      input,
      result,
      storedAt: new Date(),
    });
  } catch (error) {
    console.error("[persistRiskAssessment] Failed to store assessment in MongoDB", error);
  }
}
