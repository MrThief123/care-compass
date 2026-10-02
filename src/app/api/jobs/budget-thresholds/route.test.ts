import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runJob = vi.fn();
vi.mock("@/server/jobs/budget-thresholds", () => ({ runBudgetThresholdsJob: runJob }));
vi.mock("@/server/email/provider", () => ({ createEmailProviderFromEnv: () => ({}) }));

const URL_ = "http://localhost/api/jobs/budget-thresholds";

describe("[INT-01][AC-04] budget-thresholds job endpoint auth (Vercel Cron, CHG-046)", () => {
  beforeEach(() => {
    runJob.mockReset();
    runJob.mockResolvedValue({ emailsSent: 0, failures: [] });
    vi.stubEnv("JOBS_SECRET", "jobs-secret");
    vi.stubEnv("CRON_SECRET", "cron-secret");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("[INT-01][AC-04] GET with the Vercel Cron bearer secret runs the job", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request(URL_, { headers: { authorization: "Bearer cron-secret" } }),
    );
    expect(response.status).toBe(200);
    expect(runJob).toHaveBeenCalledTimes(1);
  });

  it("[INT-01][AC-04] GET without, or with the wrong, bearer secret returns 401 and does nothing", async () => {
    const { GET } = await import("./route");
    const attempts: Record<string, string>[] = [
      {},
      { authorization: "Bearer nope" },
      { authorization: "cron-secret" },
    ];
    for (const headers of attempts) {
      const response = await GET(new Request(URL_, { headers }));
      expect(response.status).toBe(401);
    }
    expect(runJob).not.toHaveBeenCalled();
  });

  it("[INT-01][AC-04] GET is refused when CRON_SECRET is unset, even for an empty bearer", async () => {
    vi.stubEnv("CRON_SECRET", "");
    const { GET } = await import("./route");
    const response = await GET(new Request(URL_, { headers: { authorization: "Bearer " } }));
    expect(response.status).toBe(401);
    expect(runJob).not.toHaveBeenCalled();
  });

  it("[INT-01][AC-04] the JOBS_SECRET is not accepted as the cron bearer, nor the cron secret on POST", async () => {
    const { GET, POST } = await import("./route");
    const viaBearer = await GET(
      new Request(URL_, { headers: { authorization: "Bearer jobs-secret" } }),
    );
    const viaHeader = await POST(
      new Request(URL_, { method: "POST", headers: { "x-jobs-secret": "cron-secret" } }),
    );
    expect(viaBearer.status).toBe(401);
    expect(viaHeader.status).toBe(401);
    expect(runJob).not.toHaveBeenCalled();
  });

  it("[INT-01][AC-04] POST with x-jobs-secret still runs the job (manual trigger)", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request(URL_, { method: "POST", headers: { "x-jobs-secret": "jobs-secret" } }),
    );
    expect(response.status).toBe(200);
    expect(runJob).toHaveBeenCalledTimes(1);
  });
});

describe("[INT-01] vercel.json cron schedule (CHG-046)", () => {
  it("[INT-01] schedules the budget-thresholds job at the protected route, once a day", () => {
    const config = JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf8")) as {
      crons: { path: string; schedule: string }[];
    };
    expect(config.crons).toEqual([
      {
        path: "/api/jobs/budget-thresholds",
        schedule: expect.stringMatching(/^\d+ \d+ \* \* \*$/),
      },
    ]);
  });
});
