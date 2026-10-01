import "server-only";

/**
 * The one interface every email send in this codebase goes through (OQ-17: Resend, or
 * Supabase SMTP, "confirm budget with client" — either sits behind this same shape, so the
 * choice is a deploy-time env var, not a code change). Mirrors the data-source-adapter
 * pattern (ARCHITECTURE.md §3.2): callers depend on `EmailProvider`, never on a concrete
 * provider, so a test gives them `FakeEmailProvider` instead (tests/integration/budget-thresholds.test.ts).
 */
export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<{ ok: true } | { ok: false; error: string }>;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Calls Resend's HTTP API directly (no SDK: one small JSON POST, ARCHITECTURE.md §7 "no second
 * library for an existing concern"). `from` and the API key are both deploy config, read once
 * at construction so a misconfigured deploy fails fast rather than per send.
 */
export class ResendEmailProvider implements EmailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: EmailMessage): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      const response = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.from,
          to: message.to,
          subject: message.subject,
          text: message.text,
        }),
      });
      if (!response.ok) {
        return { ok: false, error: `Resend returned ${response.status}` };
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "network error" };
    }
  }
}

/**
 * Reads `RESEND_API_KEY`/`RESEND_FROM_EMAIL` at call time, not module load: the route handler
 * is the only caller, and the job itself takes an `EmailProvider` so it never needs these.
 */
export function createEmailProviderFromEnv(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error(
      "RESEND_API_KEY and RESEND_FROM_EMAIL must both be set to run the budget-thresholds job for real.",
    );
  }
  return new ResendEmailProvider(apiKey, from);
}
