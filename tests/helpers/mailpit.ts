/**
 * Test-only (F0-24). Reads the local Supabase stack's mail catcher on `[inbucket]` in config.toml
 * (http://127.0.0.1:54324). Older CLIs run Inbucket, newer ones Mailpit; both are supported, told
 * apart by whether Mailpit's `/api/v1/messages` exists. Local stack only: never point this at the
 * hosted project.
 */
const BASE = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

interface Mail {
  id: string;
  created: number;
  subject: string;
  to: string[];
}

const address = (value: string) => (/<([^>]+)>/.exec(value)?.[1] ?? value).trim().toLowerCase();

async function json<T>(path: string): Promise<{ status: number; body: T }> {
  const response = await fetch(`${BASE}${path}`);
  return { status: response.status, body: (await response.json().catch(() => null)) as T };
}

async function listFor(to: string): Promise<Mail[]> {
  const wanted = to.toLowerCase();
  const mailpit = await json<{
    messages: { ID: string; Created: string; Subject: string; To: { Address: string }[] }[];
  }>("/api/v1/messages");
  if (mailpit.status === 200) {
    return mailpit.body.messages
      .filter((m) => m.To.some((t) => t.Address.toLowerCase() === wanted))
      .map((m) => ({
        id: m.ID,
        created: new Date(m.Created).getTime(),
        subject: m.Subject,
        to: m.To.map((t) => t.Address.toLowerCase()),
      }));
  }
  // Inbucket: one mailbox per address local part.
  const mailbox = await json<{ id: string; to: string[]; subject: string; date: string }[]>(
    `/api/v1/mailbox/${encodeURIComponent(wanted.split("@")[0]!)}`,
  );
  return (mailbox.body ?? [])
    .filter((m) => m.to.some((t) => address(t) === wanted))
    .map((m) => ({
      id: m.id,
      created: new Date(m.date).getTime(),
      subject: m.subject,
      to: m.to.map(address),
    }));
}

async function linkOf(to: string, id: string): Promise<string | undefined> {
  const mailpit = await json<{ HTML: string; Text: string }>(`/api/v1/message/${id}`);
  let html: string;
  let text: string;
  if (mailpit.status === 200 && mailpit.body) {
    ({ HTML: html, Text: text } = mailpit.body);
  } else {
    const inbucket = await json<{ body: { html: string; text: string } }>(
      `/api/v1/mailbox/${encodeURIComponent(to.split("@")[0]!)}/${id}`,
    );
    ({ html, text } = inbucket.body.body);
  }
  return /href="([^"]+)"/.exec(html ?? "")?.[1] ?? /https?:\/\/\S+/.exec(text ?? "")?.[0];
}

/** Waits for a message to `to` newer than `since`, then returns the first link in its body. */
export async function waitForEmailLink(
  to: string,
  { since = Date.now() - 5_000, timeoutMs = 15_000 } = {},
): Promise<{ subject: string; link: string }> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = (await listFor(to))
      .filter((m) => m.created >= since)
      .sort((a, b) => b.created - a.created)[0];
    if (found) {
      const href = await linkOf(to, found.id);
      if (!href) throw new Error("the email has no link");
      return { subject: found.subject, link: href.replaceAll("&amp;", "&") };
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`no email to ${to} arrived in the local mail catcher`);
}

/** How many messages to `to` (any age) the catcher holds; used to prove nothing was sent. */
export async function countEmailsTo(to: string): Promise<number> {
  return (await listFor(to)).length;
}
