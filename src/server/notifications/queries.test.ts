// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCarerNotifications } from "@/server/notifications/queries";

/**
 * Contract tests for the carer's notifications (CHG-025, amending PD-048):
 * shift assigned, changed and cancelled only, each naming the client.
 */

const SHIFT_MESSAGE = /^(New shift assigned|Shift changed|Shift cancelled): .+\(Margaret\)\.$/;

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "mock");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("[CAR-UI-01][AC-02][AC-06] getCarerNotifications", () => {
  it("[CAR-UI-01][AC-02] Aisha's newest notification is 'New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret).' from Admin", async () => {
    const rows = await getCarerNotifications("staff-aisha");

    expect(rows[0]).toMatchObject({
      source: "admin",
      message: "New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret).",
    });
  });

  it("[CAR-UI-01][AC-06] Aisha has one assigned, one changed and one cancelled shift notification, all from Admin", async () => {
    const rows = await getCarerNotifications("staff-aisha");

    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row.source === "admin")).toBe(true);
    expect(rows.every((row) => SHIFT_MESSAGE.test(row.message))).toBe(true);
    expect(rows.map((row) => row.message.split(":")[0]).sort()).toEqual([
      "New shift assigned",
      "Shift cancelled",
      "Shift changed",
    ]);
  });

  it("[CAR-UI-01][AC-06] notifications are newest first", async () => {
    const rows = await getCarerNotifications("staff-aisha");
    const created = rows.map((row) => Date.parse(row.createdAt));

    expect(created).toEqual([...created].sort((a, b) => b - a));
  });

  it("[CAR-UI-01][AC-06] only the carer's own notifications are returned", async () => {
    const rows = await getCarerNotifications("staff-aisha");

    expect(rows.every((row) => row.carerId === "staff-aisha")).toBe(true);
  });

  it("[CAR-UI-01][AC-07] an unknown carer has no notifications", async () => {
    await expect(getCarerNotifications("staff-nobody")).resolves.toEqual([]);
  });
});

describe("[CAR-UI-01][PRD] supabase mode", () => {
  it("[CAR-UI-01][PRD] getCarerNotifications throws the not-implemented error naming its domain and function", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");

    await expect(getCarerNotifications("staff-aisha")).rejects.toThrow(
      /notifications\.getCarerNotifications: DATA_SOURCE="supabase" is not implemented yet/,
    );
  });
});
