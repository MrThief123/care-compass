// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MARGARET_CLIENT_ID } from "@/mocks/fixtures";
import { getClientInfoSections } from "@/server/clients/queries";

// The three texts as drawn in docs/design/screens/family-04-info.png.
const DESCRIPTION =
  "Margaret lives independently with regular support from Banksia Home Care. She uses a walking frame for mobility outside the home and prefers morning appointments.";
const HABITS =
  "Enjoys gardening and radio in the afternoon. Prefers tea over coffee. Sleeps 9pm–7am — morning routine should not be rushed.";
const MEDICAL_HISTORY =
  "Type 2 diabetes (diagnosed 2019), mild osteoarthritis. Known allergy: penicillin. See attached care plan for full medication schedule.";

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "mock");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("[FAM-UI-04][AC-01] getClientInfoSections", () => {
  it("[FAM-UI-04][AC-01] returns Description, Habits and Medical history, in that order", async () => {
    const sections = await getClientInfoSections(MARGARET_CLIENT_ID);

    expect(sections.map((section) => section.kind)).toEqual([
      "description",
      "habits",
      "medicalHistory",
    ]);
    expect(sections.map((section) => section.title)).toEqual([
      "Description",
      "Habits",
      "Medical history",
    ]);
  });

  it("[FAM-UI-04][AC-01] carries the design text word for word", async () => {
    const sections = await getClientInfoSections(MARGARET_CLIENT_ID);

    expect(sections.map((section) => section.content)).toEqual([
      DESCRIPTION,
      HABITS,
      MEDICAL_HISTORY,
    ]);
  });

  it("[FAM-UI-04][AC-01] returns only the requested client's sections", async () => {
    const sections = await getClientInfoSections(MARGARET_CLIENT_ID);

    expect(sections.every((section) => section.clientId === MARGARET_CLIENT_ID)).toBe(true);
  });

  it("[FAM-UI-04][PRD] returns an empty array for a client with none and for an unknown client", async () => {
    expect(await getClientInfoSections("client-robert")).toEqual([]);
    expect(await getClientInfoSections("client-does-not-exist")).toEqual([]);
  });

  it("[FAM-UI-04][PRD] object-prototype names are unknown clients, not errors", async () => {
    for (const name of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
      expect(await getClientInfoSections(name)).toEqual([]);
    }
  });

  it("[FAM-UI-04][PRD] does not let a caller change the fixtures by editing what it was given", async () => {
    const first = await getClientInfoSections(MARGARET_CLIENT_ID);
    first[0]!.content = "changed";
    first.reverse();

    const second = await getClientInfoSections(MARGARET_CLIENT_ID);

    expect(second[0]!.content).toBe(DESCRIPTION);
    expect(second.map((section) => section.kind)).toEqual([
      "description",
      "habits",
      "medicalHistory",
    ]);
  });
});

describe("[FAM-UI-04][PRD] supabase mode", () => {
  it("[FAM-UI-04][PRD] getClientInfoSections throws the not-implemented error naming its domain and function", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");

    await expect(getClientInfoSections(MARGARET_CLIENT_ID)).rejects.toThrow(
      /clients\.getClientInfoSections: DATA_SOURCE="supabase" is not implemented yet/,
    );
  });
});
