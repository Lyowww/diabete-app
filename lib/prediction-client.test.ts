import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { generatePrediction } from "@/lib/prediction-client";
import type { RiskAssessmentInput } from "@/types/prediction";

const sampleInput: RiskAssessmentInput = {
  pregnancies: 4,
  glucose: 156,
  bloodPressure: 88,
  skinThickness: 32,
  insulin: 180,
  bmi: 31.8,
  diabetesPedigreeFunction: 0.74,
  age: 58,
};

const envKeys = [
  "PREDICTION_API_URL",
  "PREDICTION_API_KEY",
  "PREDICTION_API_KEY_HEADER",
  "PREDICTION_API_KEY_PREFIX",
  "PREDICTION_API_TIMEOUT_MS",
] as const;

afterEach(() => {
  for (const key of envKeys) {
    delete process.env[key];
  }

  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("generatePrediction", () => {
  it("falls back to the embedded Pima model when no external URL is configured", async () => {
    const result = await generatePrediction(sampleInput);

    expect(result.providerMode).toBe("embedded");
    expect(result.provider).toBe("Embedded Pima logistic model");
    expect(result.probability).toBeGreaterThan(0);
    expect(result.contributors.length).toBeGreaterThan(0);
  });

  it("normalizes a successful external API response", async () => {
    process.env.PREDICTION_API_URL = "https://example.com/predict";
    process.env.PREDICTION_API_KEY = "secret-token";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          probability: 0.61,
          risk_level: "high",
          confidence: 0.88,
          provider: "Clinical API",
          recommended_actions: ["Schedule a confirmatory HbA1c test."],
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await generatePrediction(sampleInput);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result.providerMode).toBe("external");
    expect(result.provider).toBe("Clinical API");
    expect(result.riskLevel).toBe("high");
    expect(result.recommendedActions).toEqual(["Schedule a confirmatory HbA1c test."]);
  });
});
