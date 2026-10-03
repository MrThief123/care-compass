/**
 * Test-only (F0-24). Reads the local Supabase stack's Mailpit (`[inbucket]` in config.toml,
 * http://127.0.0.1:54324). Local stack only: never point this at the hosted project.
 */
const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

interface Summary {
  ID: string;
  Created: string;
  Subject: string;
  To: { Address: string }[];
}

/** Waits for a message to `to` newer than `since`, then returns the first link in its HTML body. */
export async function waitForEmailLink(
  to: string,
  { since = Date.now() - 5_000, timeoutMs = 15_000 } = {},
): Promise<{ subject: string; link: string }> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const list = (await (await fetch(`${MAILPIT}/api/v1/messages`)).json()) as {
      messages: Summary[];
    };
    const found = list.messages.find(
      (m) =>
        m.To.some((t) => t.Address.toLowerCase() === to.toLowerCase()) &&
        new Date(m.Created).getTime() >= since,
    );
    if (found) {
      const full = (await (await fetch(`${MAILPIT}/api/v1/message/${found.ID}`)).json()) as {
        HTML: string;
        Text: string;
      };
      const href = /href="([^"]+)"/.exec(full.HTML)?.[1] ?? /https?:\/\/\S+/.exec(full.Text)?.[0];
      if (!href) throw new Error("the email has no link");
      return { subject: found.Subject, link: href.replaceAll("&amp;", "&") };
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`no email to ${to} arrived in Mailpit`);
}

/** How many messages to `to` (any age) are in Mailpit; used to prove nothing was sent. */
export async function countEmailsTo(to: string): Promise<number> {
  const list = (await (await fetch(`${MAILPIT}/api/v1/messages`)).json()) as {
    messages: Summary[];
  };
  return list.messages.filter((m) => m.To.some((t) => t.Address.toLowerCase() === to.toLowerCase()))
    .length;
}
