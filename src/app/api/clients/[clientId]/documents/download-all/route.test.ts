// @vitest-environment node
import { strFromU8, unzipSync } from "fflate";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mode: "supabase" as "mock" | "supabase",
  user: { id: "u1" } as { id: string } | null,
  rows: [] as { id: string; filename: string; storage_path: string }[],
  files: {} as Record<string, string | null>,
}));

vi.mock("@/server/data-source", () => ({ getDataSourceMode: () => mocks.mode }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: mocks.user } }) },
    from: () => {
      const chain: Record<string, unknown> = {};
      chain.select = () => chain;
      chain.eq = () => chain;
      chain.is = () => chain;
      chain.order = () => chain;
      chain.then = (resolve: (v: unknown) => void) => resolve({ data: mocks.rows, error: null });
      return chain;
    },
    storage: {
      from: () => ({
        download: async (path: string) => {
          const body = mocks.files[path];
          return body == null
            ? { data: null, error: { message: "nope" } }
            : { data: new Blob([body]), error: null };
        },
      }),
    },
  }),
}));

const CLIENT = "11111111-1111-1111-1111-111111111111";
const call = async (clientId = CLIENT) => {
  const { GET } = await import("./route");
  return GET(new Request("http://localhost/x"), { params: Promise.resolve({ clientId }) });
};

beforeEach(() => {
  mocks.mode = "supabase";
  mocks.user = { id: "u1" };
  mocks.rows = [
    { id: "a", filename: "Care plan.pdf", storage_path: "p/a" },
    { id: "b", filename: "Care plan.pdf", storage_path: "p/b" },
  ];
  mocks.files = { "p/a": "AAA", "p/b": "BBB" };
});

describe("[F0-25][AC-09] download-all route", () => {
  it("[F0-25][AC-09] returns a zip of every document with unique names", async () => {
    const response = await call();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/zip");
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="care-compass-documents-\d{4}-\d{2}-\d{2}\.zip"$/,
    );
    const files = unzipSync(new Uint8Array(await response.arrayBuffer()));
    expect(Object.keys(files).sort()).toEqual(["Care plan (2).pdf", "Care plan.pdf"]);
    expect(strFromU8(files["Care plan.pdf"]!)).toBe("AAA");
    expect(strFromU8(files["Care plan (2).pdf"]!)).toBe("BBB");
  });
});

describe("[F0-25][AC-10] download-all route access", () => {
  it("[F0-25][AC-10] no session returns 401 and no file", async () => {
    mocks.user = null;
    const response = await call();
    expect(response.status).toBe(401);
    expect(response.headers.get("content-type")).not.toBe("application/zip");
  });

  it("[F0-25][AC-10] no visible documents (no access, or none) returns the same 404", async () => {
    mocks.rows = [];
    expect((await call()).status).toBe(404);
  });

  it("[F0-25][AC-10] a malformed client id returns 404", async () => {
    expect((await call("not-an-id")).status).toBe(404);
  });
});

describe("[F0-25][AC-11] download-all route failures", () => {
  it("[F0-25][AC-11] mock data mode says documents are not available yet", async () => {
    mocks.mode = "mock";
    const response = await call();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ message: "Documents are not available yet." });
  });

  it("[F0-25][AC-11] an unreadable first storage object fails the request, no partial zip", async () => {
    mocks.files = { "p/a": null, "p/b": "BBB" };
    const response = await call();
    expect(response.status).toBe(502);
    expect(response.headers.get("content-type")).not.toBe("application/zip");
  });

  it("[F0-25][AC-11] more than 300 documents is refused with a clear message", async () => {
    mocks.rows = Array.from({ length: 301 }, (_, i) => ({
      id: `${i}`,
      filename: `f${i}.pdf`,
      storage_path: `p/${i}`,
    }));
    const response = await call();
    expect(response.status).toBe(413);
    expect((await response.json()).message).toMatch(/300/);
  });
});
