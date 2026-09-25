// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FAMILY_PROFILES } from "@/mocks/fixtures";
import { getFamilyContactDetails } from "@/server/profiles/queries";
import { ProfileSchema } from "@/types/domain";

const fake = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { maybeSingle, eq, select, from };
});

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: fake.from }) }));

// Helen's details as drawn in docs/design/screens/family-05-settings.png, with the
// full name (CHG-023, PD-038).
const HELEN = {
  profileId: "profile-helen",
  name: "Helen Doyle",
  phone: "0412 345 678",
  email: "helen@example.com",
  address: "12 Wattle St, Preston VIC 3072",
};

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "mock");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("[FAM-UI-06][CHG-023] getFamilyContactDetails", () => {
  it("[FAM-UI-06][CHG-023] returns Helen's full name, phone, contact email and address", async () => {
    expect(await getFamilyContactDetails("profile-helen")).toEqual(HELEN);
  });

  it("[FAM-UI-06][CHG-023] rejects an unknown profile id, as getClientHeaderSummary does", async () => {
    await expect(getFamilyContactDetails("profile-does-not-exist")).rejects.toThrow();
  });

  it("[FAM-UI-06][CHG-023] leaves out a missing phone or address rather than returning an empty string", async () => {
    const michael = await getFamilyContactDetails("profile-michael");

    expect(michael.name).toBe("Michael Hale");
    expect("phone" in michael).toBe(false);
    expect("address" in michael).toBe(false);
  });

  it("[FAM-UI-06][CHG-023] does not let a caller change the fixtures by editing what it was given", async () => {
    const first = await getFamilyContactDetails("profile-helen");
    first.phone = "changed";
    first.name = "changed";

    expect(await getFamilyContactDetails("profile-helen")).toEqual(HELEN);
  });
});

describe("[FAM-UI-06][CHG-023] Helen's profile fixture", () => {
  it("[FAM-UI-06][CHG-023] carries the design's phone, contact email and address, and keeps them through the domain schema", () => {
    const helen = FAMILY_PROFILES.find((profile) => profile.id === "profile-helen");

    const parsed = ProfileSchema.parse(helen);
    expect(parsed).toMatchObject({
      firstName: "Helen",
      lastName: "Doyle",
      phone: HELEN.phone,
      email: HELEN.email,
      address: HELEN.address,
    });
  });
});

/*
 * FAM-12 implements the Supabase branch, so the FAM-UI-06 test that expected a
 * "not implemented" error is replaced by these two (FAM-12 DECISIONS FD-06,
 * flagged HUMAN REVIEW). The real database is covered in
 * tests/integration/family-settings-profile.test.ts.
 */
describe("[FAM-12][CHG-023] supabase mode", () => {
  it("[FAM-12][CHG-023] getFamilyContactDetails reads the profile row as the signed-in user and maps it", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    fake.maybeSingle.mockResolvedValue({
      data: {
        id: "profile-helen",
        first_name: "Helen",
        last_name: "Doyle",
        phone: "0412 345 678",
        email: "helen@example.com",
        address: "12 Wattle St, Preston VIC 3072",
      },
      error: null,
    });

    await expect(getFamilyContactDetails("profile-helen")).resolves.toEqual(HELEN);
    expect(fake.from).toHaveBeenCalledWith("profiles");
    expect(fake.eq).toHaveBeenCalledWith("id", "profile-helen");
  });

  it("[FAM-12][CHG-023] getFamilyContactDetails leaves out a missing phone, email or address", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    fake.maybeSingle.mockResolvedValue({
      data: {
        id: "profile-helen",
        first_name: "Helen",
        last_name: "Doyle",
        phone: null,
        email: null,
        address: null,
      },
      error: null,
    });

    await expect(getFamilyContactDetails("profile-helen")).resolves.toEqual({
      profileId: "profile-helen",
      name: "Helen Doyle",
    });
  });

  it("[FAM-12][CHG-023] getFamilyContactDetails throws, naming no profile, when no row comes back", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    fake.maybeSingle.mockResolvedValue({ data: null, error: null });

    const rejection = getFamilyContactDetails("profile-secret-id");
    await expect(rejection).rejects.toThrow("getFamilyContactDetails: profile not found.");
    await expect(rejection).rejects.not.toThrow(/profile-secret-id/);
  });
});
