import { NextResponse } from "next/server";

import en from "@/locales/en.json";
import { persistRiskAssessment } from "@/lib/persist-assessment";
import { PredictionProviderError, generatePrediction } from "@/lib/prediction-client";
import { predictionRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

const api = en.api;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = predictionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: api.reviewFields,
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = await generatePrediction(parsed.data.input);
    await persistRiskAssessment(parsed.data.input, result);
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: api.invalidJson }, { status: 400 });
    }

    if (error instanceof PredictionProviderError) {
      return NextResponse.json(
        {
          error: error.statusCode === 504 ? api.timeout : api.unavailable,
        },
        { status: error.statusCode },
      );
    }

    return NextResponse.json({ error: api.generic }, { status: 500 });
  }
}
