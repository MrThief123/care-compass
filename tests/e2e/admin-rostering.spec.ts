import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

import { totpCode } from "../helpers/totp";

loadEnv({ path: ".env.local" });

// [INT-04] Cross-dashboard rostering journey: Priya (admin) assigns Aisha (carer) to Margaret on
// Tue 1 Dec 2026 through Admin · Manage; Aisha then sees the "new shift" notification and the shift
// on her Home calendar, and Helen (family) sees Aisha assigned that day. Finally an overlapping
// assignment shows the warning and still goes through (D30, never a hard block).
//
// Writes an organisation, people, an event and shifts to the database it points at, so it only
// runs against a LOCAL Supabase stack with the app started on that stack (same setup as
// admin-assign-shift.spec.ts, INT-02 FD-01 for E2E_PORT):
//   E2E_PORT=3140 E2E_DATA_SOURCE=supabase NEXT_PUBLIC_SUPABASE_URL=... npx playwright test tests/e2e/admin-rostering.spec.ts
// (the three Supabase variables come from `supabase status -o env`; `.env.local` is the hosted project).
//
// The "new shift" notification is written by CAR-02's `shifts_notify_carer` trigger on the shift
// insert ADM-07's action makes, with the client's full name (CAR-02 FD-03, CHG-032), so the message
// reads "(Margaret Doyle-…)" rather than the AC's "(Margaret)" (DECISIONS.md FD-02).
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const enabled =
  isLocalUrl &&
  process.env.E2E_DATA_SOURCE === "supabase" &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";
const TASK = "Morning medication";
/** Tue 1 Dec 2026 09:30 Melbourne (AEDT, UTC+11): inside the 09:00–11:00 shift. */
const TASK_START = "2026-11-30T22:30:00.000Z";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/**
 * F0-16's cast in a fresh organisation (never the seeded one): Priya (admin), Aisha Rahman
 * (carer), Margaret (client), Helen (family of Margaret) and one task on Tue 1 Dec 09:30. No shifts:
 * the journey's admin creates them.
 */
async function seed() {
  const admin = db();
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const org = await admin
    .from("organisations")
    .insert({ name: `Banksia int-04-${stamp}` })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");

  async function person(
    label: string,
    role: "admin" | "carer" | "family",
    first: string,
    last: string,
  ) {
    const email = `int-04-${label}-${stamp}@example.test`;
    const user = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (user.error || !user.data.user) throw user.error ?? new Error(label);
    const profile = await admin.from("profiles").insert({
      id: user.data.user.id,
      role,
      organisation_id: role === "family" ? null : org.data!.id,
      first_name: first,
      last_name: last,
    });
    if (profile.error) throw profile.error;
    return { id: user.data.user.id, email };
  }
  const priya = await person("priya", "admin", "Priya", "Nair");
  const aisha = await person("aisha", "carer", "Aisha", "Rahman");
  const helen = await person("helen", "family", "Helen", "Doyle");

  const lastName = `Doyle-${stamp}`;
  const client = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: lastName, organisation_id: org.data.id })
    .select("id")
    .single();
  if (client.error || !client.data) throw client.error ?? new Error("client");
  const link = await admin
    .from("client_family_members")
    .insert({ client_id: client.data.id, profile_id: helen.id, relationship_label: "Daughter" });
  if (link.error) throw link.error;

  const event = await admin
    .from("care_events")
    .insert({ client_id: client.data.id, title: TASK, starts_at: TASK_START })
    .select("id")
    .single();
  if (event.error || !event.data) throw event.error ?? new Error("event");

  return {
    orgId: org.data.id,
    priya,
    aisha,
    helen,
    clientId: client.data.id,
    margaret: `Margaret ${lastName}`,
  };
}
type Seed = Awaited<ReturnType<typeof seed>>;

async function cleanUp(s: Seed) {
  const admin = db();
  await admin.from("shifts").delete().eq("client_id", s.clientId);
  await admin.from("care_events").delete().eq("client_id", s.clientId);
  await admin.from("clients").delete().eq("id", s.clientId);
  for (const user of [s.priya, s.aisha, s.helen]) await admin.auth.admin.deleteUser(user.id);
  await admin.from("organisations").delete().eq("id", s.orgId);
}

async function shiftRows(s: Seed) {
  const rows = await db()
    .from("shifts")
    .select("carer_id, starts_at, ends_at")
    .eq("client_id", s.clientId)
    .order("starts_at");
  if (rows.error) throw rows.error;
  return rows.data.map((row) => ({
    carer_id: row.carer_id,
    starts_at: new Date(row.starts_at).toISOString(),
    ends_at: new Date(row.ends_at).toISOString(),
  }));
}

async function signIn(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.waitForLoadState("networkidle"); // hydrated, so Sign in submits through its handler
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
}

/** Signs in and completes TOTP enrolment (F0-07/F0-20 forced MFA), landing on Admin Home. */
async function signInAsAdmin(page: Page, email: string) {
  await signIn(page, email);
  await expect(page).toHaveURL(/\/mfa\/enroll$/);
  const key = (await page.getByTestId("mfa-manual-key").textContent())?.trim();
  if (!key) throw new Error("no manual key on the enrol page");
  await page.getByLabel("6-digit code").fill(totpCode(key));
  await page.getByRole("button", { name: /verify and continue/i }).click();
  await expect(page).toHaveURL(/\/admin\/home$/);
}

/** Admin · Manage with Aisha and Margaret selected and Tue 1 Dec 2026 chosen in the date picker. */
async function openManageOnFirstDec(page: Page, s: Seed) {
  await page.goto(`/admin/manage?staff=${s.aisha.id}&client=${s.clientId}`);
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(`Aisha Rahman → ${s.margaret}`)).toBeVisible();
  const firstDec = page.getByTestId("date-picker-day-2026-12-01");
  for (let i = 0; i < 24 && !(await firstDec.isVisible().catch(() => false)); i += 1) {
    await page.getByRole("button", { name: "Next month" }).click();
  }
  await firstDec.click();
}

async function chooseTime(page: Page, start: string, end: string) {
  const [startHour, startMinute] = start.split(":");
  const [endHour, endMinute] = end.split(":");
  await page.getByLabel("Start hour").selectOption(startHour!);
  await page.getByLabel("Start minute").selectOption(startMinute!);
  await page.getByLabel("End hour").selectOption(endHour!);
  await page.getByLabel("End minute").selectOption(endMinute!);
}

/** Aisha's Notifications card on Carer Home (CAR-02). */
function notificationsList(page: Page) {
  return page.getByRole("list", { name: "Notifications", exact: true });
}

test.describe("[INT-04] Admin rostering journey across Admin, Carer and Family", () => {
  test.skip(!enabled, "Needs local Supabase and E2E_DATA_SOURCE=supabase — see the comment above.");
  // One journey: each step builds on the shift the step before it created.
  test.describe.configure({ mode: "serial" });

  let s: Seed;
  let adminContext: BrowserContext;
  let carerContext: BrowserContext;
  let familyContext: BrowserContext;
  let admin: Page;
  let carer: Page;
  let family: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    test.setTimeout(120_000);
    s = await seed();
    adminContext = await browser.newContext();
    carerContext = await browser.newContext();
    familyContext = await browser.newContext();
    admin = await adminContext.newPage();
    carer = await carerContext.newPage();
    family = await familyContext.newPage();
    await signInAsAdmin(admin, s.priya.email);
    await signIn(carer, s.aisha.email);
    await signIn(family, s.helen.email);
  });

  test.afterAll(async () => {
    await adminContext?.close();
    await carerContext?.close();
    await familyContext?.close();
    if (s) await cleanUp(s);
  });

  test("[INT-04][AC-01] T-01 given Priya assigns Aisha to Margaret on Tue 1 Dec 09:00–11:00, when Aisha opens Home, then 'New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret …).' is listed", async () => {
    // Admin: assign through the Manage screen (ADM-07).
    await openManageOnFirstDec(admin, s);
    await chooseTime(admin, "09:00", "11:00");
    await expect(admin.getByText(/already has a shift/)).toHaveCount(0);
    await admin.getByRole("button", { name: "Assign shift" }).click();
    await expect(admin.getByRole("status")).toContainText("Shift assigned");

    expect(await shiftRows(s)).toEqual([
      {
        carer_id: s.aisha.id,
        starts_at: "2026-11-30T22:00:00.000Z",
        ends_at: "2026-12-01T00:00:00.000Z",
      },
    ]);

    // Carer: Home lists the notification the shift insert produced (CAR-02), unread.
    await carer.goto("/carer/home");
    await expect(notificationsList(carer)).toContainText(
      `New shift assigned: Tuesday 1 Dec, 09:00–11:00 (${s.margaret}).`,
    );
    await expect(carer.getByRole("button", { name: "Notifications, 1 unread" })).toBeVisible();
  });

  test("[INT-04][AC-02] T-02 given that shift, when Aisha opens the Calendar week of 30 Nov, then a Tuesday block for Margaret is shown", async () => {
    // CHG-031: the carer's shifts calendar is on Carer Home (CAR-05); the URL is its state.
    await carer.goto("/carer/home?view=week&date=2026-11-30");
    const shifts = carer.getByRole("region", { name: "Shifts" });
    await expect(shifts.getByText("30 Nov – 6 Dec 2026", { exact: true })).toBeVisible();
    await expect(shifts.getByRole("radio", { name: "W" })).toHaveAttribute("aria-checked", "true");

    const tuesday = carer.getByTestId("week-grid-day-2026-12-01");
    await expect(tuesday.getByTestId(/^week-grid-block-/)).toHaveCount(1);
    await expect(tuesday.getByTestId(/^week-grid-block-/)).toContainText(s.margaret);
    for (const day of ["2026-11-30", "2026-12-02", "2026-12-03", "2026-12-04"]) {
      await expect(
        carer.getByTestId(`week-grid-day-${day}`).getByTestId(/^week-grid-block-/),
      ).toHaveCount(0);
    }
  });

  test("[INT-04][PRD] T-03 REQ-26 given that shift, when Helen opens Margaret's 09:30 task on Tue 1 Dec, then it is assigned to Aisha Rahman", async () => {
    await family.goto(`/family/${s.clientId}/calendar?view=week&date=2026-12-01`);
    await family.waitForLoadState("networkidle"); // hydrated, so a block click navigates
    const block = family
      .getByTestId("week-grid-day-2026-12-01")
      .getByRole("button", { name: new RegExp(TASK) });
    await block.click();
    await family.waitForURL(`**/family/${s.clientId}/tasks/**`);
    await expect(family.getByRole("heading", { level: 1, name: TASK })).toBeVisible();
    await expect(family.getByText(/Assigned to Aisha Rahman/)).toBeVisible();
  });

  test("[INT-04][PRD] T-04 overlap: given Aisha's 09:00–11:00 shift, when Priya chooses 10:00–12:00 the same day, the warning names 09:00 - 11:00 and the assignment still goes through", async () => {
    await openManageOnFirstDec(admin, s);
    await chooseTime(admin, "10:00", "12:00");
    await expect(admin.getByText(/already has a shift/)).toContainText(
      `Aisha Rahman already has a shift with ${s.margaret} from 09:00 - 11:00 that overlaps this time. You can still assign it.`,
    );
    const assign = admin.getByRole("button", { name: "Assign shift" });
    await expect(assign).toBeEnabled();
    await assign.click();
    await expect(admin.getByRole("status")).toContainText("Shift assigned");

    expect(await shiftRows(s)).toEqual([
      {
        carer_id: s.aisha.id,
        starts_at: "2026-11-30T22:00:00.000Z",
        ends_at: "2026-12-01T00:00:00.000Z",
      },
      {
        carer_id: s.aisha.id,
        starts_at: "2026-11-30T23:00:00.000Z",
        ends_at: "2026-12-01T01:00:00.000Z",
      },
    ]);

    await carer.goto("/carer/home");
    await expect(notificationsList(carer)).toContainText(
      `New shift assigned: Tuesday 1 Dec, 10:00–12:00 (${s.margaret}).`,
    );
  });
});
