import "server-only";

import { buildMockPrediction, normalizeExternalPrediction } from "@/lib/risk-engine";
import type { PredictionResult, RiskAssessmentInput } from "@/types/prediction";

const DEFAULT_TIMEOUT_MS = 8_000;

export class PredictionProviderError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = "PredictionProviderError";
    this.statusCode = statusCode;
  }
}

function getTimeoutMs() {
  const parsed = Number(process.env.PREDICTION_API_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

function buildHeaders() {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  const apiKey = process.env.PREDICTION_API_KEY;

  if (!apiKey) {
    return headers;
  }

  const headerName = process.env.PREDICTION_API_KEY_HEADER ?? "Authorization";
  const prefix = process.env.PREDICTION_API_KEY_PREFIX ?? "Bearer";
  headers[headerName] =
    headerName.toLowerCase() === "authorization" && prefix.length > 0
      ? `${prefix} ${apiKey}`
      : apiKey;

  return headers;
}

export async function generatePrediction(input: RiskAssessmentInput): Promise<PredictionResult> {
  const apiUrl = process.env.PREDICTION_API_URL;

  if (!apiUrl) {
    return buildMockPrediction(input);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ input }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new PredictionProviderError(
        `Prediction provider returned ${response.status}.`,
        response.status === 408 || response.status === 504 ? 504 : 502,
      );
    }

    const payload = (await response.json()) as unknown;
    return normalizeExternalPrediction(payload, input);
  } catch (error) {
    if (error instanceof PredictionProviderError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new PredictionProviderError("Prediction request timed out.", 504);
    }

    if (error instanceof Error) {
      throw new PredictionProviderError(error.message);
    }

    throw new PredictionProviderError("Prediction service is unavailable right now.");
  } finally {
    clearTimeout(timeout);
  }
}
