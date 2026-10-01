import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

// [INT-03] Cross-dashboard journey: a carer on shift ticks a task, the family sees who did it;
// a carer off shift cannot. Requires a running local Supabase stack and `.env.local` pointing at
// it (same convention as carer-complete-task.spec.ts, organisation-transfer.spec.ts) and is
// meant to run with E2E_DATA_SOURCE=supabase on a dedicated E2E_PORT (INT-02 FD-01: a stray
// server on 3000 is otherwise reused silently). Each test seeds its own organisation, carer,
// family member, client, event and shifts, and removes them afterwards. Do not run it against
// the hosted project: it writes rows there.
//
// Clock control (PRD Technical Considerations, DECISIONS.md FD-02): "on shift" is decided by
// Postgres `now()`, so a browser clock mock cannot move it. Shift windows are seeded relative to
// the real clock with wide margins, and "the shift has ended" is produced by moving the shift
// row's `ends_at` into the past with the service-role client.
//
// CAR-07 (carer adds an event) and CAR-08 (expense, RETIRED by CHG-020) are not merged, so
// their steps are not part of this journey (PRD Scope; DECISIONS.md FD-03).
const hasLocalSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const PASSWORD = "correct horse battery staple 1!";
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const TASK = "Afternoon check-in";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

const at = (offsetMs: number) =>
  new Date(Math.floor((Date.now() + offsetMs) / 1000) * 1000).toISOString();

/** Minutes since midnight in Australia/Melbourne, where "today" is decided (ARCHITECTURE §12). */
function melbourneMinutesNow(): number {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

/**
 * A start a few minutes ago that is still Melbourne-today, so the task appears on both the
 * carer's Calendar (today selected) and the family's Today timeline even just after midnight.
 */
function taskStartToday(): string {
  const back = Math.min(10, melbourneMinutesNow());
  return at(-back * MINUTE);
}

/**
 * F0-16's cast: Banksia (organisation), Aisha Rahman (carer) on a shift with Margaret in
 * progress now, Helen (family) of Margaret, and one manual task, Afternoon check-in, today.
 */
async function seed() {
  const admin = serviceClient();
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const org = await admin
    .from("organisations")
    .insert({ name: `Banksia int-03-${stamp}` })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");

  async function person(label: string, role: "carer" | "family", first: string, last: string) {
    const email = `int-03-${label}-${stamp}@example.test`;
    const user = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (user.error || !user.data.user) throw user.error ?? new Error(label);
    const profile = await admin.from("profiles").insert({
      id: user.data.user.id,
      role,
      organisation_id: role === "carer" ? org.data!.id : null,
      first_name: first,
      last_name: last,
    });
    if (profile.error) throw profile.error;
    return { id: user.data.user.id, email };
  }
  const aisha = await person("aisha", "carer", "Aisha", "Rahman");
  const helen = await person("helen", "family", "Helen", "Doyle");

  const lastName = `Doyle-${stamp}`;
  const client = await admin
    .from("clients")
    .insert({
      first_name: "Margaret",
      last_name: lastName,
      organisation_id: org.data.id,
      suburb: "Preston VIC",
    })
    .select("id")
    .single();
  if (client.error || !client.data) throw client.error ?? new Error("client");
  const link = await admin
    .from("client_family_members")
    .insert({ client_id: client.data.id, profile_id: helen.id, relationship_label: "Daughter" });
  if (link.error) throw link.error;

  const taskStart = taskStartToday();
  const event = await admin
    .from("care_events")
    .insert({ client_id: client.data.id, title: TASK, starts_at: taskStart })
    .select("id")
    .single();
  if (event.error || !event.data) throw event.error ?? new Error("event");

  // In progress now, with an hour's margin either side (FD-02).
  const shift = await admin
    .from("shifts")
    .insert({
      client_id: client.data.id,
      carer_id: aisha.id,
      starts_at: at(-HOUR),
      ends_at: at(HOUR),
    })
    .select("id")
    .single();
  if (shift.error || !shift.data) throw shift.error ?? new Error("shift");

  return {
    admin,
    orgId: org.data.id,
    aisha,
    helen,
    clientId: client.data.id,
    margaret: `Margaret ${lastName}`,
    eventId: event.data.id,
    taskStart,
    shiftId: shift.data.id,
  };
}
type Seed = Awaited<ReturnType<typeof seed>>;

/** Clock control (FD-02): Aisha's shift with Margaret ended a few minutes ago. */
async function endShift(s: Seed) {
  const ended = await s.admin
    .from("shifts")
    .update({ starts_at: at(-2 * HOUR), ends_at: at(-5 * MINUTE) })
    .eq("id", s.shiftId);
  if (ended.error) throw ended.error;
}

/**
 * Another shift with Margaret tomorrow: per F0-18 (PD-041) a carer keeps read access to a patient
 * only while she has a shift with them that has not ended, so this is what lets Aisha still open
 * Margaret's Calendar once today's shift is over.
 */
async function addUpcomingShift(s: Seed) {
  const next = await s.admin.from("shifts").insert({
    client_id: s.clientId,
    carer_id: s.aisha.id,
    starts_at: at(24 * HOUR),
    ends_at: at(28 * HOUR),
  });
  if (next.error) throw next.error;
}

async function completions(s: Seed) {
  const rows = await s.admin
    .from("care_event_completions")
    .select("action, actor_id, actor_display_name")
    .eq("event_id", s.eventId);
  if (rows.error) throw rows.error;
  return rows.data;
}

// Completions are append-only and restrict deleting their client, so Margaret is left behind
// when a test recorded one (unique name/stamp, as CAR-06's and INT-02's tests do).
async function cleanUp(s: Seed) {
  for (const user of [s.aisha, s.helen]) await s.admin.auth.admin.deleteUser(user.id);
  await s.admin.from("shifts").delete().eq("client_id", s.clientId);
  await s.admin.from("care_events").delete().eq("client_id", s.clientId);
  await s.admin.from("clients").delete().eq("id", s.clientId);
  await s.admin.from("organisations").delete().eq("id", s.orgId);
}

async function signIn(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.waitForLoadState("networkidle"); // hydrated, so Sign in submits through its handler
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
}

/** Aisha's own Supabase session, outside the browser, to call the tick-off RPC directly. */
async function carerSession(email: string) {
  const session = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const signedIn = await session.auth.signInWithPassword({ email, password: PASSWORD });
  if (signedIn.error) throw signedIn.error;
  return session;
}

/** Margaret's Today timeline row for the task, on Helen's Family Home. */
function familyTaskRow(page: Page) {
  return page
    .getByRole("list", { name: "Care events today" })
    .getByRole("link", { name: new RegExp(TASK) });
}

test.describe(() => {
  test.skip(!hasLocalSupabase, "Requires a running local Supabase stack — see README.");

  test("[INT-03][AC-01] T-01 given Aisha on shift completes Afternoon check-in, when Helen loads Home, then the block shows 'Done · Aisha Rahman'", async ({
    browser,
  }) => {
    const s = await seed();
    const carerContext = await browser.newContext();
    const familyContext = await browser.newContext();
    try {
      // Carer: signs in, opens her rostered patient from Patients, ticks the task in Calendar.
      const carer = await carerContext.newPage();
      await signIn(carer, s.aisha.email);
      await carer.goto("/carer/patients");
      const card = carer.getByRole("link", { name: new RegExp(s.margaret) });
      await expect(card).toContainText("On shift · can edit");
      await card.click();
      await carer.waitForURL(`**/carer/patients/${s.clientId}/home`);
      await carer
        .getByRole("navigation", { name: "Margaret's pages" })
        .getByRole("link", { name: "Calendar" })
        .click();
      await carer.waitForURL(`**/carer/patients/${s.clientId}/calendar**`);
      await carer.waitForLoadState("networkidle"); // hydrated, so the checkbox has its handler

      const box = carer.getByRole("region", { name: "Tasks" }).getByLabel(TASK);
      await box.check();
      await expect(box).toBeChecked();
      await carer.reload();
      await expect(carer.getByRole("region", { name: "Tasks" }).getByLabel(TASK)).toBeChecked();

      // REQ-19: one Done, recorded against Aisha by full name (PD-038).
      expect(await completions(s)).toEqual([
        { action: "done", actor_id: s.aisha.id, actor_display_name: "Aisha Rahman" },
      ]);

      // Family: Helen's Today timeline shows the block Done by Aisha.
      const family = await familyContext.newPage();
      await signIn(family, s.helen.email);
      await family.goto(`/family/${s.clientId}/home`);
      await expect(familyTaskRow(family)).toContainText("Done · Aisha Rahman");
    } finally {
      await carerContext.close();
      await familyContext.close();
      await cleanUp(s);
    }
  });

  test("[INT-03][AC-02] T-02 given Aisha's shift has ended, when she opens Margaret's Calendar, the task has no tick box and the database refuses a tick", async ({
    browser,
  }) => {
    const s = await seed();
    await endShift(s);
    await addUpcomingShift(s);
    const carerContext = await browser.newContext();
    const familyContext = await browser.newContext();
    try {
      const carer = await carerContext.newPage();
      await signIn(carer, s.aisha.email);
      await carer.goto("/carer/patients");
      await expect(carer.getByRole("link", { name: new RegExp(s.margaret) })).toContainText(
        "View only",
      );
      await carer.goto(`/carer/patients/${s.clientId}/calendar`);
      const tasks = carer.getByRole("region", { name: "Tasks" });
      await expect(tasks.getByText(TASK)).toBeVisible();
      await expect(tasks.getByRole("checkbox")).toHaveCount(0);
      await expect(carer.getByRole("note")).toContainText("View only");

      // Going around the UI does not help: the RPC itself refuses (42501).
      const session = await carerSession(s.aisha.email);
      const direct = await session.rpc("set_occurrence_done", {
        p_event_id: s.eventId,
        p_original_start: s.taskStart,
      });
      expect(direct.error?.code).toBe("42501");
      await session.auth.signOut();
      expect(await completions(s)).toEqual([]);

      const family = await familyContext.newPage();
      await signIn(family, s.helen.email);
      await family.goto(`/family/${s.clientId}/home`);
      await expect(familyTaskRow(family)).toBeVisible();
      await expect(familyTaskRow(family)).not.toContainText("Done ·");
    } finally {
      await carerContext.close();
      await familyContext.close();
      await cleanUp(s);
    }
  });

  test("[INT-03][AC-02] T-02b given Aisha opened Margaret's Calendar on shift and the shift then ends, when she ticks the task, it is not saved", async ({
    browser,
  }) => {
    const s = await seed();
    await addUpcomingShift(s); // so the reload below still has read access (F0-18)
    const carerContext = await browser.newContext();
    try {
      const carer = await carerContext.newPage();
      await signIn(carer, s.aisha.email);
      await carer.goto(`/carer/patients/${s.clientId}/calendar`);
      await carer.waitForLoadState("networkidle");
      const box = carer.getByRole("region", { name: "Tasks" }).getByLabel(TASK);
      await expect(box).toBeEnabled();

      // The clock passes the shift's end while the page is open (FD-02).
      await endShift(s);

      // The stale page still offers the tick box; the database is what refuses it.
      await box.click();
      await expect(carer.getByText("Not permitted to tick off this task.")).toBeVisible();
      await expect(box).not.toBeChecked();
      expect(await completions(s)).toEqual([]);

      await carer.reload();
      const tasks = carer.getByRole("region", { name: "Tasks" });
      await expect(tasks.getByText(TASK)).toBeVisible();
      await expect(tasks.getByRole("checkbox")).toHaveCount(0);
    } finally {
      await carerContext.close();
      await cleanUp(s);
    }
  });
});
