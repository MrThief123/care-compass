import { describe, expect, it } from "vitest";

import { MARGARET_CLIENT_ID } from "@/mocks/fixtures";

import { getClientShifts } from "./events";

describe("getClientShifts (mock)", () => {
  it("returns the client's shifts for the day with the carers' full names, earliest first", async () => {
    const shifts = await getClientShifts(MARGARET_CLIENT_ID, {
      from: "2026-11-30",
      to: "2026-11-30",
    });
    expect(shifts.map((shift) => shift.carerName)).toEqual(["Aisha Rahman", "Sarah Nguyen"]);
  });

  it("returns none for another client", async () => {
    expect(await getClientShifts("nobody", { from: "2026-11-30", to: "2026-11-30" })).toEqual([]);
  });
});
