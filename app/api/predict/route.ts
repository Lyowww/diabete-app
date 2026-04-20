import { NextResponse } from "next/server";

import { PredictionProviderError, generatePrediction } from "@/lib/prediction-client";
import { predictionRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = predictionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please review the highlighted answers and try again.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = await generatePrediction(parsed.data.input);
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    if (error instanceof PredictionProviderError) {
      return NextResponse.json(
        {
          error:
            error.statusCode === 504
              ? "The prediction service took too long to respond."
              : "The prediction service is currently unavailable.",
        },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "We could not complete the assessment right now. Please try again shortly." },
      { status: 500 },
    );
  }
}
