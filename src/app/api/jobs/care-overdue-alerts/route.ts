import { NextResponse } from "next/server";

import { createEmailProviderFromEnv } from "@/server/email/provider";
import { runCareOverdueAlertsJob } from "@/server/jobs/care-overdue-alerts";

const SECRET_HEADER = "x-jobs-secret";

const BEARER_PREFIX = "Bearer ";

/**
 * INT-09: triggered by the scheduler, never by a signed-in user. AC-05: a request without the
 * exact secret (compared in constant time, so timing cannot narrow it down byte by byte) gets a
 * bare 401 and the job never runs.
 *
 * Vercel Cron (CHG-046, OQ-17) calls with `GET` and `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request): Promise<Response> {
  const given = request.headers.get("authorization");
  const token = given?.startsWith(BEARER_PREFIX) ? given.slice(BEARER_PREFIX.length) : null;
  return runIfAuthorised(process.env.CRON_SECRET, token);
}

/** Manual trigger: `POST` with the `x-jobs-secret` header equal to `JOBS_SECRET`. */
export async function POST(request: Request): Promise<Response> {
  return runIfAuthorised(process.env.JOBS_SECRET, request.headers.get(SECRET_HEADER));
}

async function runIfAuthorised(
  secret: string | undefined,
  given: string | null,
): Promise<Response> {
  if (!secret || !given || !timingSafeEqualStrings(given, secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await runCareOverdueAlertsJob(createEmailProviderFromEnv());
  return NextResponse.json(result);
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
