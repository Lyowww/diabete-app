import { NextResponse } from "next/server";

import { getRiskAssessmentsCsvString } from "@/lib/csv-risk-assessments";
import { isExportRequestAuthorized } from "@/lib/export-request-auth";
import { getMongoDb } from "@/lib/mongodb";
import en from "@/locales/en.json";

export const runtime = "nodejs";

const messages = en.api.export;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "cache-control": "no-store" } });
}

export async function GET(request: Request) {
  if (!getMongoDb()) {
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
    if (isLikelyMongoConnectionFailure(error)) {
      return jsonError(messages.connectionFailed, 502);
    }
    return jsonError(en.api.generic, 500);
  }
}

function isLikelyMongoConnectionFailure(error: unknown): boolean {
  const name = error && typeof error === "object" && "name" in error ? String((error as { name: string }).name) : "";
  if (name.startsWith("Mongo") || name === "MongoError") {
    return true;
  }
  if (error instanceof Error) {
    const m = error.message;
    if (/MONGODB_URI not set/i.test(m)) {
      return true;
    }
    if (/getaddrinfo|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|IP whitelist|not allowed|network|socket|SSL|tls|authentication failed/i.test(m)) {
      return true;
    }
  }
  return false;
}
