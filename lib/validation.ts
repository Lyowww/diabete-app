import { z } from "zod";

export const riskAssessmentSchema = z
  .object({
    pregnancies: z
      .number()
      .int()
      .min(0, "Pregnancies cannot be negative.")
      .max(20, "Pregnancy count must be 20 or below."),
    glucose: z.number().min(1, "Glucose must be greater than 0.").max(300, "Glucose looks too high."),
    bloodPressure: z
      .number()
      .min(1, "Blood pressure must be greater than 0.")
      .max(250, "Blood pressure looks too high."),
    skinThickness: z
      .number()
      .min(0, "Skin thickness cannot be negative.")
      .max(100, "Skin thickness looks too high."),
    insulin: z.number().min(0, "Insulin cannot be negative.").max(1000, "Insulin looks too high."),
    diabetesPedigreeFunction: z
      .number()
      .min(0, "Diabetes pedigree function cannot be negative.")
      .max(3, "Diabetes pedigree function looks too high."),
    age: z.number().int().min(18, "Age must be at least 18.").max(120, "Age looks too high."),
    bmi: z
      .number()
      .min(1, "BMI must be greater than 0.")
      .max(80, "BMI must be 80 or below."),
  })
  .strict();

export const predictionRequestSchema = z.object({
  input: riskAssessmentSchema,
});

export type RiskFormValues = z.infer<typeof riskAssessmentSchema>;
