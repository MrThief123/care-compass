import { afterEach, describe, expect, it, vi } from "vitest";

import { ResendEmailProvider, createEmailProviderFromEnv } from "./provider";

describe("[INT-01] ResendEmailProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("posts the message to Resend with the configured from address and the API key as a bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new ResendEmailProvider("re_test_key", "Care Compass <noreply@example.test>");

    const result = await provider.send({
      to: "helen@example.test",
      subject: "Budget update",
      text: "The Schedule of Care Program for Margaret has reached 85% of its allocation.",
    });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer re_test_key",
          "Content-Type": "application/json",
        }),
      }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(body).toEqual({
      from: "Care Compass <noreply@example.test>",
      to: "helen@example.test",
      subject: "Budget update",
      text: "The Schedule of Care Program for Margaret has reached 85% of its allocation.",
    });
  });

  it("[AC-05] reports a non-2xx response as a failure rather than throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 422 })));
    const provider = new ResendEmailProvider("re_test_key", "noreply@example.test");

    const result = await provider.send({ to: "x@example.test", subject: "s", text: "t" });

    expect(result).toEqual({ ok: false, error: "Resend returned 422" });
  });

  it("[AC-05] reports a network failure as a failure rather than throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed: ECONNREFUSED")));
    const provider = new ResendEmailProvider("re_test_key", "noreply@example.test");

    const result = await provider.send({ to: "x@example.test", subject: "s", text: "t" });

    expect(result).toEqual({ ok: false, error: "fetch failed: ECONNREFUSED" });
  });
});

describe("[INT-01] createEmailProviderFromEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws a clear error when RESEND_API_KEY or RESEND_FROM_EMAIL is missing", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("RESEND_FROM_EMAIL", "");
    expect(() => createEmailProviderFromEnv()).toThrow(/RESEND_API_KEY and RESEND_FROM_EMAIL/);
  });

  it("builds a working provider once both are set", () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("RESEND_FROM_EMAIL", "noreply@example.test");
    expect(createEmailProviderFromEnv()).toBeInstanceOf(ResendEmailProvider);
  });
});
