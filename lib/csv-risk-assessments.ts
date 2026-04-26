import "server-only";

import { ObjectId } from "mongodb";

import { getMongoClient } from "@/lib/mongodb";
import { RISK_ASSESSMENTS_COLLECTION } from "@/lib/persist-assessment";
import type { PredictionResult, RiskAssessmentInput } from "@/types/prediction";

type StoredAssessment = {
  _id: ObjectId;
  input?: RiskAssessmentInput;
  result?: PredictionResult;
  storedAt?: Date;
};

const COLUMNS: readonly { key: string; get: (d: StoredAssessment) => unknown }[] = [
  { key: "_id", get: (d) => d._id.toHexString() },
  { key: "storedAt", get: (d) => (d.storedAt instanceof Date ? d.storedAt.toISOString() : d.storedAt ?? "") },
  { key: "input_pregnancies", get: (d) => d.input?.pregnancies },
  { key: "input_glucose", get: (d) => d.input?.glucose },
  { key: "input_bloodPressure", get: (d) => d.input?.bloodPressure },
  { key: "input_skinThickness", get: (d) => d.input?.skinThickness },
  { key: "input_insulin", get: (d) => d.input?.insulin },
  { key: "input_diabetesPedigreeFunction", get: (d) => d.input?.diabetesPedigreeFunction },
  { key: "input_age", get: (d) => d.input?.age },
  { key: "input_bmi", get: (d) => d.input?.bmi },
  { key: "result_probability", get: (d) => d.result?.probability },
  { key: "result_riskLevel", get: (d) => d.result?.riskLevel },
  { key: "result_score", get: (d) => d.result?.score },
  { key: "result_maxScore", get: (d) => d.result?.maxScore },
  { key: "result_confidence", get: (d) => d.result?.confidence },
  { key: "result_evaluatedAt", get: (d) => d.result?.evaluatedAt },
  { key: "result_provider", get: (d) => d.result?.provider },
  { key: "result_providerMode", get: (d) => d.result?.providerMode },
  { key: "result_summary", get: (d) => d.result?.summary },
  { key: "result_recommendedActions", get: (d) => d.result?.recommendedActions?.join(" | ") ?? "" },
  {
    key: "result_contributors",
    get: (d) =>
      d.result?.contributors?.length
        ? JSON.stringify(d.result.contributors)
        : "",
  },
  { key: "result_disclaimer", get: (d) => d.result?.disclaimer },
];

function escapeCsvCell(value: unknown): string {
  if (value == null) {
    return "";
  }
  if (value instanceof Date) {
    return escapeCsvCell(value.toISOString());
  }
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowFromDocument(doc: StoredAssessment): string {
  return COLUMNS.map((c) => escapeCsvCell(c.get(doc))).join(",");
}

export async function getRiskAssessmentsCsvString(): Promise<{ csv: string; rowCount: number }> {
  const client = getMongoClient();
  if (!client) {
    throw new Error("MONGODB_URI not set");
  }

  await client.connect();
  const collection = client.db().collection<StoredAssessment>(RISK_ASSESSMENTS_COLLECTION);
  const documents = await collection.find().sort({ storedAt: -1 }).toArray();

  const header = COLUMNS.map((c) => c.key).join(",");
  const body = documents.map((doc) => rowFromDocument(doc)).join("\r\n");
  const csv = [header, body].filter((part) => part.length > 0).join("\r\n");

  return { csv, rowCount: documents.length };
}
