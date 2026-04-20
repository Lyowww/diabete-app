import { z } from "zod";

export const riskAssessmentSchema = z
  .object({
    age: z.number().int().min(18, "Age must be at least 18.").max(120, "Age looks too high."),
    biologicalSex: z.enum(["female", "male", "another"]),
    bmi: z
      .number()
      .min(15, "BMI must be at least 15.")
      .max(60, "BMI must be 60 or below."),
    familyHistory: z.boolean(),
    hypertension: z.boolean(),
    activityLevel: z.enum(["low", "moderate", "high"]),
    glucoseHistory: z.enum(["normal", "borderline", "high"]),
    smokingStatus: z.enum(["never", "former", "current"]),
    sleepHours: z
      .number()
      .min(4, "Sleep should be at least 4 hours.")
      .max(12, "Sleep should be 12 hours or less."),
    gestationalDiabetes: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.biologicalSex !== "female" && value.gestationalDiabetes) {
      ctx.addIssue({
        code: "custom",
        path: ["gestationalDiabetes"],
        message: "Gestational diabetes should only be marked if pregnancy history applies.",
      });
    }
  });

export const predictionRequestSchema = z.object({
  input: riskAssessmentSchema,
});

export type RiskFormValues = z.infer<typeof riskAssessmentSchema>;
