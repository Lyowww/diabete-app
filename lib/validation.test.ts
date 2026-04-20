import { describe, expect, it } from "vitest";

import { riskAssessmentSchema } from "@/lib/validation";

describe("riskAssessmentSchema", () => {
  it("accepts a valid adult risk profile", () => {
    const result = riskAssessmentSchema.safeParse({
      age: 48,
      biologicalSex: "female",
      bmi: 29.7,
      familyHistory: true,
      hypertension: false,
      activityLevel: "moderate",
      glucoseHistory: "borderline",
      smokingStatus: "former",
      sleepHours: 7,
      gestationalDiabetes: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects gestational diabetes answers when pregnancy history does not apply", () => {
    const result = riskAssessmentSchema.safeParse({
      age: 39,
      biologicalSex: "male",
      bmi: 25.1,
      familyHistory: false,
      hypertension: false,
      activityLevel: "high",
      glucoseHistory: "normal",
      smokingStatus: "never",
      sleepHours: 7.5,
      gestationalDiabetes: true,
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.gestationalDiabetes).toContain(
        "Gestational diabetes should only be marked if pregnancy history applies.",
      );
    }
  });

  it("enforces minimum adult age", () => {
    const result = riskAssessmentSchema.safeParse({
      age: 16,
      biologicalSex: "female",
      bmi: 22.4,
      familyHistory: false,
      hypertension: false,
      activityLevel: "high",
      glucoseHistory: "normal",
      smokingStatus: "never",
      sleepHours: 8,
      gestationalDiabetes: false,
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.age).toContain("Age must be at least 18.");
    }
  });
});
