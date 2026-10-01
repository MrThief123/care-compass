import { NextResponse } from "next/server";

import { createEmailProviderFromEnv } from "@/server/email/provider";
import { runBudgetThresholdsJob } from "@/server/jobs/budget-thresholds";

const SECRET_HEADER = "x-jobs-secret";

/**
 * INT-01: triggered by the scheduler (OQ-17: Vercel Cron or pg_cron), never by a signed-in
 * user. AC-04: a request without the exact `JOBS_SECRET` (compared in constant time, so timing
 * cannot narrow it down byte by byte) gets a bare 401 and the job never runs.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.JOBS_SECRET;
  const given = request.headers.get(SECRET_HEADER);
  if (!secret || !given || !timingSafeEqualStrings(given, secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await runBudgetThresholdsJob(createEmailProviderFromEnv());
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
