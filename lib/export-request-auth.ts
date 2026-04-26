import "server-only";

/**
 * When RISK_CSV_EXPORT_TOKEN is set, requests must pass the same value via
 * `?token=`, header `X-Export-Token`, or `Authorization: Bearer`.
 */
export function isExportRequestAuthorized(request: Request): boolean {
  const expected = process.env.RISK_CSV_EXPORT_TOKEN;
  if (!expected) {
    return false;
  }

  const url = new URL(request.url);
  if (url.searchParams.get("token") === expected) {
    return true;
  }

  if (request.headers.get("x-export-token") === expected) {
    return true;
  }

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7) === expected;
  }

  return false;
}
