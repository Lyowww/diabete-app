import { z } from "zod";

import en from "@/locales/en.json";

const v = en.validation;

function coalesceNumber(value: unknown): unknown {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "number" && Number.isNaN(value)) {
    return undefined;
  }

  return value;
}

function requiredIntField(min: number, max: number, messages: { required: string; min: string; max: string }) {
  return z.preprocess(
    coalesceNumber,
    z
      .union([z.number().int().min(min, messages.min).max(max, messages.max), z.undefined()])
      .refine((val) => val !== undefined, { message: messages.required }),
  );
}

function requiredFloatField(min: number, max: number, messages: { required: string; min: string; max: string }) {
  return z.preprocess(
    coalesceNumber,
    z
      .union([z.number().min(min, messages.min).max(max, messages.max), z.undefined()])
      .refine((val) => val !== undefined, { message: messages.required }),
  );
}

export const riskAssessmentSchema = z
  .object({
    pregnancies: requiredIntField(0, 20, v.pregnancies),
    glucose: requiredFloatField(1, 300, v.glucose),
    bloodPressure: requiredFloatField(1, 250, v.bloodPressure),
    skinThickness: requiredFloatField(0, 100, v.skinThickness),
    insulin: requiredFloatField(0, 1000, v.insulin),
    diabetesPedigreeFunction: requiredFloatField(0, 3, v.diabetesPedigreeFunction),
    age: requiredIntField(18, 120, v.age),
    bmi: requiredFloatField(1, 80, v.bmi),
  })
  .strict();

export const predictionRequestSchema = z.object({
  input: riskAssessmentSchema,
});

export type RiskFormValues = z.infer<typeof riskAssessmentSchema>;
