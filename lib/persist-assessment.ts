import "server-only";

import { getMongoClient, getMongoDb, withMongoConnectionRetry } from "@/lib/mongodb";
import type { PredictionResult, RiskAssessmentInput } from "@/types/prediction";

export const RISK_ASSESSMENTS_COLLECTION = "risk_assessments";

export async function persistRiskAssessment(
  input: RiskAssessmentInput,
  result: PredictionResult,
): Promise<void> {
  if (!process.env.MONGODB_URI) {
    return;
  }

  try {
    await withMongoConnectionRetry(async () => {
      const c = getMongoClient();
      if (!c) {
        return;
      }
      await c.connect();
      const db = getMongoDb();
      if (!db) {
        return;
      }
      await db.collection(RISK_ASSESSMENTS_COLLECTION).insertOne({
        input,
        result,
        storedAt: new Date(),
      });
    });
  } catch (error) {
    console.error("[persistRiskAssessment] Failed to store assessment in MongoDB", error);
  }
}
