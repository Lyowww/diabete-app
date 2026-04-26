import { NextResponse } from "next/server";

import { getRiskAssessmentsCsvString } from "@/lib/csv-risk-assessments";
import { isExportRequestAuthorized } from "@/lib/export-request-auth";
import { getMongoClient } from "@/lib/mongodb";
import en from "@/locales/en.json";

export const runtime = "nodejs";

const messages = en.api.export;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "cache-control": "no-store" } });
}

export async function GET(request: Request) {
  if (!getMongoClient()) {
    return jsonError(messages.noDb, 503);
  }

  if (!process.env.RISK_CSV_EXPORT_TOKEN) {
    return jsonError(messages.noToken, 501);
  }

  if (!isExportRequestAuthorized(request)) {
    return jsonError(messages.unauthorized, 401);
  }

  try {
    const { csv, rowCount } = await getRiskAssessmentsCsvString();
    const datePart = new Date().toISOString().slice(0, 10);
    const filename = `risk-assessments-${datePart}.csv`;
    const body = `\uFEFF${csv}`;

    return new NextResponse(body, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
        "x-export-row-count": String(rowCount),
      },
    });
  } catch (error) {
    console.error("[risk-assessments-csv] export failed", error);
    return jsonError(en.api.generic, 500);
  }
}
