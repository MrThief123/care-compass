// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * [FAM-11] `saveBudgetEdit` with the Supabase client faked, so the exact RPC call and the way each
 * database error is reported can be checked. The real database is covered in
 * supabase/tests/budget_save_edit.test.sql and tests/integration/family-budget-update-funds.test.ts.
 */
const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc: mocks.rpc }),
}));

const CLIENT_ID = "b1111111-1111-1111-1111-111111111111";
const NDIS_ID = "c0000000-0000-0000-0000-000000000001";
const GOV_ID = "c0000000-0000-0000-0000-000000000002";

const NOT_ALLOWED =
  "Only the client’s family or their organisation’s admins can change the budget.";
const GENERAL = "Couldn’t save the budget. Try again.";

type Edit = {
  buckets: {
    id: string;
    name: string;
    direction: "add" | "remove";
    amount: number;
    remove: boolean;
  }[];
  added: { name: string; startingAmount: number }[];
  note?: string;
};

function edit(overrides: Partial<Edit> = {}): Edit {
  return {
    buckets: [{ id: NDIS_ID, name: "NDIS", direction: "add", amount: 1000, remove: false }],
    added: [],
    ...overrides,
  };
}

beforeEach(() => {
  mocks.rpc.mockResolvedValue({ data: null, error: null });
  vi.stubEnv("DATA_SOURCE", "supabase");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

async function save(clientId: string, value: unknown) {
  const { saveBudgetEdit } = await import("@/server/budget/actions");
  return saveBudgetEdit(clientId, value as Edit);
}

describe("[FAM-11][AC-07] saveBudgetEdit calls the database once, in its own words", () => {
  it("[FAM-11][AC-07] T-12 calls save_budget_edit with the client, the rows in snake_case, and the note", async () => {
    const result = await save(
      CLIENT_ID,
      edit({
        buckets: [
          { id: NDIS_ID, name: "NDIS", direction: "add", amount: 1000.5, remove: false },
          { id: GOV_ID, name: "Government", direction: "remove", amount: 0, remove: true },
        ],
        added: [{ name: "Council grant", startingAmount: 1200 }],
        note: "Q3 plan review",
      }),
    );

    expect(result).toEqual({ ok: true, data: undefined });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("save_budget_edit", {
      p_client_id: CLIENT_ID,
      p_buckets: [
        { id: NDIS_ID, name: "NDIS", direction: "add", amount: 1000.5, remove: false },
        { id: GOV_ID, name: "Government", direction: "remove", amount: 0, remove: true },
      ],
      p_added: [{ name: "Council grant", starting_amount: 1200 }],
      p_note: "Q3 plan review",
    });
  });

  it("[FAM-11][AC-07] T-12 sends a null note when there is none", async () => {
    await save(CLIENT_ID, edit());

    expect(mocks.rpc.mock.calls[0]![1]).toMatchObject({ p_note: null });
  });

  it("[FAM-11][AC-07] T-12 with DATA_SOURCE=mock nothing can be saved, and it says so without calling", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");

    const result = await save(CLIENT_ID, edit());

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_AVAILABLE");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe("[FAM-11][AC-02] saveBudgetEdit refuses what the database would refuse, before calling it", () => {
  it.each([
    ["a client id that is not a uuid", "client-margaret", edit()],
    ["an empty client id", "", edit()],
    [
      "a bucket id that is not a uuid",
      CLIENT_ID,
      edit({ buckets: [{ id: "ndis", name: "NDIS", direction: "add", amount: 1, remove: false }] }),
    ],
    [
      "a negative amount",
      CLIENT_ID,
      edit({
        buckets: [{ id: NDIS_ID, name: "NDIS", direction: "add", amount: -50, remove: false }],
      }),
    ],
    [
      "an amount with 3 decimals",
      CLIENT_ID,
      edit({
        buckets: [{ id: NDIS_ID, name: "NDIS", direction: "add", amount: 12.345, remove: false }],
      }),
    ],
    [
      "an amount that is not a number",
      CLIENT_ID,
      edit({
        buckets: [
          {
            id: NDIS_ID,
            name: "NDIS",
            direction: "add",
            amount: "abc" as unknown as number,
            remove: false,
          },
        ],
      }),
    ],
    [
      "an amount of $10,000,000,000",
      CLIENT_ID,
      edit({
        buckets: [
          { id: NDIS_ID, name: "NDIS", direction: "add", amount: 10_000_000_000, remove: false },
        ],
      }),
    ],
    [
      "a direction that is not add or remove",
      CLIENT_ID,
      edit({
        buckets: [
          { id: NDIS_ID, name: "NDIS", direction: "swap" as "add", amount: 1, remove: false },
        ],
      }),
    ],
    [
      "an empty name",
      CLIENT_ID,
      edit({ buckets: [{ id: NDIS_ID, name: "  ", direction: "add", amount: 1, remove: false }] }),
    ],
    [
      "a name of 41 characters",
      CLIENT_ID,
      edit({ added: [{ name: "x".repeat(41), startingAmount: 1 }] }),
    ],
    [
      "a negative starting amount",
      CLIENT_ID,
      edit({ added: [{ name: "Grant", startingAmount: -1 }] }),
    ],
    [
      "a missing starting amount",
      CLIENT_ID,
      edit({ added: [{ name: "Grant" } as unknown as { name: string; startingAmount: number }] }),
    ],
    ["a missing edit", CLIENT_ID, undefined],
  ])("[FAM-11][AC-02] T-04 refuses %s and calls nothing", async (_label, clientId, value) => {
    const result = await save(clientId, value);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("[FAM-11][AC-02] T-04 names the wrong field the way the page does", async () => {
    const result = await save(
      CLIENT_ID,
      edit({
        buckets: [
          { id: NDIS_ID, name: "NDIS", direction: "add", amount: 5, remove: false },
          { id: GOV_ID, name: "Government", direction: "add", amount: -1, remove: false },
        ],
        added: [{ name: "", startingAmount: 5 }],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.error.fields ?? {}).sort()).toEqual([
        "added.0.name",
        "buckets.1.amount",
      ]);
    }
  });
});

describe("[FAM-11][AC-03] saveBudgetEdit reports what the database decides", () => {
  it("[FAM-11][AC-03] T-07 reports a permission error as not allowed, in words that name nothing", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "42501",
        message: `not permitted to change the budget of ${CLIENT_ID}`,
        details: "",
      },
    });

    const result = await save(CLIENT_ID, edit());

    expect(result).toEqual({ ok: false, error: { code: "NOT_ALLOWED", message: NOT_ALLOWED } });
  });
});

describe("[FAM-11][AC-02] saveBudgetEdit turns the database's refusals into field errors", () => {
  it.each([
    ["22023", "buckets.0.amount", "Only $240.00 available"],
    ["23505", "buckets.1.name", "a bucket with this name already exists"],
    [
      "22023",
      "added.0.startingAmount",
      "enter an amount of $0 or more, with at most 2 decimal places",
    ],
    ["22023", "buckets.2.remove", "a bucket with costs charged to it cannot be removed"],
  ])(
    "[FAM-11][AC-02] T-11 %s with detail %s becomes an error on that field",
    async (code, path, message) => {
      mocks.rpc.mockResolvedValue({ data: null, error: { code, message, details: path } });

      const result = await save(CLIENT_ID, edit());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION");
        expect(result.error.fields).toEqual({ [path]: message });
      }
    },
  );

  it("[FAM-11][AC-02] T-11 a refusal with no field path asks for a reload, saying nothing of the cause", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "22023", message: `that bucket has been removed (${NDIS_ID})`, details: "" },
    });

    const result = await save(CLIENT_ID, edit());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNEXPECTED");
      expect(result.error.fields).toBeUndefined();
      expect(result.error.message).not.toContain(NDIS_ID);
    }
  });

  it("[FAM-11][AC-02] T-11 an unknown error is a general message that carries no database text", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "XX000", message: `boom for ${CLIENT_ID}`, details: "" },
    });

    const result = await save(CLIENT_ID, edit());

    expect(result).toEqual({ ok: false, error: { code: "UNEXPECTED", message: GENERAL } });
  });

  it("[FAM-11][AC-02] T-11 a call that throws is reported, never thrown to the page", async () => {
    mocks.rpc.mockRejectedValue(new Error(`network down for ${CLIENT_ID}`));

    const result = await save(CLIENT_ID, edit());

    expect(result).toEqual({ ok: false, error: { code: "UNEXPECTED", message: GENERAL } });
  });

  it("[FAM-11][AC-02] T-11 a field path that is not one of the page's fields is not trusted", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "22023", message: "oops", details: "<script>alert(1)</script>" },
    });

    const result = await save(CLIENT_ID, edit());

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.fields).toBeUndefined();
  });
});
