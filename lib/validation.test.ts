import { describe, expect, it } from "vitest";

import en from "@/locales/en.json";
import { riskAssessmentSchema } from "@/lib/validation";

const v = en.validation;

describe("riskAssessmentSchema", () => {
  it("accepts a valid model-aligned adult profile", () => {
    const result = riskAssessmentSchema.safeParse({
      pregnancies: 2,
      glucose: 132,
      bloodPressure: 78,
      skinThickness: 29,
      insulin: 140,
      diabetesPedigreeFunction: 0.62,
      age: 48,
      bmi: 29.7,
    });

    expect(result.success).toBe(true);
  });

  it("allows zero placeholders for insulin and skin thickness", () => {
    const result = riskAssessmentSchema.safeParse({
      pregnancies: 0,
      glucose: 117,
      bloodPressure: 72,
      skinThickness: 0,
      insulin: 0,
      diabetesPedigreeFunction: 0.31,
      age: 39,
      bmi: 25.1,
    });

    expect(result.success).toBe(true);
  });

  it("rejects nonpositive glucose values", () => {
    const result = riskAssessmentSchema.safeParse({
      pregnancies: 1,
      glucose: 0,
      bloodPressure: 74,
      skinThickness: 23,
      insulin: 85,
      diabetesPedigreeFunction: 0.22,
      age: 44,
      bmi: 22.4,
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.glucose).toContain(v.glucose.min);
    }
  });

  it("enforces minimum adult age", () => {
    const result = riskAssessmentSchema.safeParse({
      pregnancies: 0,
      glucose: 102,
      bloodPressure: 70,
      skinThickness: 18,
      insulin: 80,
      diabetesPedigreeFunction: 0.19,
      age: 16,
      bmi: 22.4,
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.age).toContain(v.age.min);
    }
  });

  it("rejects missing number fields", () => {
    const result = riskAssessmentSchema.safeParse({
      pregnancies: 2,
      glucose: NaN,
      bloodPressure: 72,
      skinThickness: 29,
      insulin: 125,
      diabetesPedigreeFunction: 0.47,
      age: 33,
      bmi: 32.3,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.glucose).toBeDefined();
    }
  });
});
