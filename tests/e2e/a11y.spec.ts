import { writeFile } from "node:fs/promises";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

import { totpCode } from "../helpers/totp";

loadEnv({ path: ".env.local" });

// INT-06: run against F0-16's LOCAL seed, with E2E_DATA_SOURCE=supabase.
// Missing infrastructure fails explicitly: a skipped audit is not assurance.
const CLIENT = "c0000000-0000-4000-8000-000000000001";
const EVENT = "e0000000-0000-4000-8000-000000000003";
const OCCURRENCE = encodeURIComponent(`${EVENT}:2026-11-30T11:30:00+11:00`);
const PASSWORD = "care-compass-local-1!";
const roles = ["family", "carer", "admin"] as const;
type Role = (typeof roles)[number];

function database() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(url)) {
    throw new Error("INT-06 requires local Supabase; hosted databases are refused.");
  }
  expect(process.env.E2E_DATA_SOURCE).toBe("supabase");
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function signIn(page: Page, email: string, admin = false) {
  await page.goto("/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  if (admin) {
    await expect(page).toHaveURL(/\/mfa\/enroll$/);
    const secret = (await page.getByTestId("mfa-manual-key").textContent())?.trim();
    if (!secret) throw new Error("Admin MFA enrolment did not provide a key");
    await page.getByLabel("6-digit code").fill(totpCode(secret));
    await page.getByRole("button", { name: /verify and continue/i }).click();
  }
  await expect(page).toHaveURL(/\/(family\/[^/]+|carer|admin)\/home$/);
}

function routes(role: Role) {
  const base =
    role === "family"
      ? `/family/${CLIENT}`
      : `/${role}/${role === "admin" ? "clients" : "patients"}/${CLIENT}`;
  const shared = [
    `${base}/home`,
    `${base}/info`,
    `${base}/calendar?date=2026-11-30&view=week`,
    `${base}/calendar?date=2026-11-30&view=day`,
    `${base}/calendar?date=2026-11-30&view=month`,
    `${base}/tasks`,
    `${base}/tasks/${OCCURRENCE}`,
    `${base}/events/new`,
    `${base}/events/${EVENT}/edit`,
  ];
  if (role !== "carer") shared.push(`${base}/budget`, `${base}/budget/edit`);
  if (role === "family") return [...shared, `${base}/settings`];
  return [
    ...shared,
    `/${role}/home`,
    `/${role}/settings`,
    ...(role === "admin"
      ? ["/admin/clients", "/admin/staff", "/admin/manage"]
      : ["/carer/patients"]),
  ];
}

test.describe("INT-06 seeded accessibility audit", () => {
  test.describe.configure({ mode: "default" });
  test.setTimeout(240_000);
  test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 });

  for (const role of roles) {
    test(`[INT-06][AC-01] ${role} dashboard routes have no serious or critical axe violations`, async ({
      page,
    }, testInfo) => {
      const db = database();
      let adminId: string | undefined;
      let shiftId: string | undefined;
      const email =
        role === "family"
          ? "helen.doyle@example.com"
          : role === "carer"
            ? "aisha.r@banksiahomecare.com.au"
            : `int06-${Date.now()}@example.test`;
      try {
        if (role === "admin") {
          // A disposable admin avoids changing Priya's existing MFA configuration.
          const user = await db.auth.admin.createUser({
            email,
            password: PASSWORD,
            email_confirm: true,
          });
          if (user.error) throw user.error;
          adminId = user.data.user.id;
          const profile = await db.from("profiles").insert({
            id: adminId,
            email,
            first_name: "Accessibility",
            last_name: "Auditor",
            role: "admin",
            organisation_id: "a0000000-0000-4000-8000-000000000001",
          });
          if (profile.error) throw profile.error;
        }
        if (role === "carer") {
          // Read AND edit routes need an active shift at the database's real clock.
          const shift = await db
            .from("shifts")
            .insert({
              organisation_id: "a0000000-0000-4000-8000-000000000001",
              client_id: CLIENT,
              carer_id: "10000000-0000-4000-8000-000000000101",
              starts_at: new Date(Date.now() - 3600000).toISOString(),
              ends_at: new Date(Date.now() + 3600000).toISOString(),
              created_by: "10000000-0000-4000-8000-000000000001",
            })
            .select("id")
            .single();
          if (shift.error) throw shift.error;
          shiftId = shift.data.id;
        }
        await signIn(page, email, role === "admin");
        await page.setViewportSize({ width: 1440, height: 1000 });
        for (const [index, route] of routes(role).entries()) {
          await test.step(route, async () => {
            try {
              const response = await page.goto(route);
              expect(response?.status(), `${route} response`).toBe(200);
              expect(new URL(page.url()).pathname, "must not audit an auth/error redirect").toBe(
                new URL(route, "http://local").pathname,
              );
              await expect(page.getByRole("main")).toBeVisible();
              await expect(page.getByRole("main")).toContainText(/\S/);
              await page.waitForLoadState("networkidle");
              await page.evaluate(() => document.fonts.ready.then(() => undefined));
              await expect(
                page.getByText(/something went wrong|couldn't load|could not load|task not found/i),
              ).toHaveCount(0);
              const result = await new AxeBuilder({ page })
                .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
                .analyze();
              await writeFile(
                testInfo.outputPath(`route-${index}.json`),
                JSON.stringify(
                  { route, violations: result.violations, incomplete: result.incomplete },
                  null,
                  2,
                ),
              );
              await testInfo.attach(`axe-${encodeURIComponent(route)}`, {
                body: JSON.stringify(
                  { route, violations: result.violations, incomplete: result.incomplete },
                  null,
                  2,
                ),
                contentType: "application/json",
              });
              expect
                .soft(
                  result.violations.filter(
                    (v) => v.impact === "serious" || v.impact === "critical",
                  ),
                  route,
                )
                .toEqual([]);
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              await writeFile(
                testInfo.outputPath(`route-${index}.json`),
                JSON.stringify({ route, error: message }, null, 2),
              );
              expect.soft(message, `Route could not be audited: ${route}`).toBe("");
            }
          });
        }
        if (role !== "family") {
          await test.step(`${role} keyboard journey opens Margaret from the directory`, async () => {
            await page.goto(role === "admin" ? "/admin/clients" : "/carer/patients");
            const client = page.getByRole("link", { name: /Margaret Doyle/ }).first();
            await expect(client).toBeVisible();
            await tabTo(page, client);
            await page.keyboard.press("Enter");
            await expect(page).toHaveURL(
              new RegExp(`/${role}/${role === "admin" ? "clients" : "patients"}/${CLIENT}/home$`),
            );
          });
        }
      } finally {
        if (shiftId) {
          const cleanup = await db.from("shifts").delete().eq("id", shiftId);
          if (cleanup.error) throw cleanup.error;
        }
        if (adminId) {
          const cleanup = await db.auth.admin.deleteUser(adminId);
          if (cleanup.error) throw cleanup.error;
        }
      }
    });
  }

  test("[INT-06][AC-02] Helen completes a calendar task using only the keyboard with visible focus", async ({
    page,
  }) => {
    database();
    await signIn(page, "helen.doyle@example.com");
    await page.goto(`/family/${CLIENT}/calendar?date=2026-11-30&view=week`);
    const checkbox = page
      .getByRole("region", { name: "Tasks", exact: true })
      .getByRole("checkbox", { name: "Physiotherapy", exact: true });
    await expect(checkbox).not.toBeChecked();
    await tabTo(page, checkbox);
    await page.keyboard.press("Space");
    await expect(checkbox).toBeChecked();
    await page.reload();
    await expect(checkbox).toBeChecked();
    // Restore this reversible completion through the same user-facing action.
    await tabTo(page, checkbox);
    await page.keyboard.press("Space");
    await expect(checkbox).not.toBeChecked();
    await page.reload();
    await expect(checkbox).not.toBeChecked();
  });
});

async function tabTo(page: Page, target: Locator) {
  for (let step = 0; step < 160; step++) {
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
    const focus = await focused.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        visible: element.matches(":focus-visible"),
        outline:
          style.outlineStyle !== "none" &&
          parseFloat(style.outlineWidth) > 0 &&
          style.outlineColor !== "rgba(0, 0, 0, 0)",
        shadow: style.boxShadow !== "none",
      };
    });
    expect(
      focus.visible && (focus.outline || focus.shadow),
      `visible focus at Tab ${step + 1}`,
    ).toBe(true);
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  throw new Error("Task checkbox unreachable after 160 Tab presses");
}
