/**
 * In-memory stand-in for the parts of `supabase.auth` the MFA actions use (F0-20 server-action
 * tests). It reproduces the behaviour hand-testing found: two factors with the same friendly name
 * (including none) collide with 422 `mfa_factor_name_conflict`, and a challenge on a factor that
 * has been removed is 404 `mfa_factor_not_found`. Every call yields once so concurrent callers
 * interleave the way overlapping server renders do.
 */
export interface FakeFactor {
  id: string;
  friendly_name?: string;
  factor_type: "totp";
  status: "verified" | "unverified";
  created_at: string;
  secret: string;
}

interface AuthErrorShape {
  name: "AuthApiError";
  message: string;
  status: number;
  code: string;
}

function authError(status: number, code: string, message: string): AuthErrorShape {
  return { name: "AuthApiError", message, status, code };
}

const yieldOnce = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export function createFakeMfaSupabase(options: { validCode?: string } = {}) {
  const factors: FakeFactor[] = [];
  const challenges = new Map<string, string>();
  let counter = 0;
  let validCode = options.validCode ?? "123456";

  const publicFactor = (factor: FakeFactor) => ({
    id: factor.id,
    friendly_name: factor.friendly_name,
    factor_type: factor.factor_type,
    status: factor.status,
    created_at: factor.created_at,
  });

  const mfa = {
    async listFactors() {
      await yieldOnce();
      const all = factors.map(publicFactor);
      return {
        data: { all, totp: all.filter((factor) => factor.status === "verified") },
        error: null,
      };
    },
    async unenroll({ factorId }: { factorId: string }) {
      await yieldOnce();
      const index = factors.findIndex((factor) => factor.id === factorId);
      if (index === -1) {
        return {
          data: null,
          error: authError(404, "mfa_factor_not_found", "Factor not found"),
        };
      }
      factors.splice(index, 1);
      return { data: { id: factorId }, error: null };
    },
    async enroll({ friendlyName }: { factorType: "totp"; friendlyName?: string }) {
      await yieldOnce();
      const name = friendlyName ?? "";
      if (factors.some((factor) => (factor.friendly_name ?? "") === name)) {
        return {
          data: null,
          error: authError(
            422,
            "mfa_factor_name_conflict",
            `A factor with the friendly name "${name}" for this user already exists`,
          ),
        };
      }
      counter += 1;
      const factor: FakeFactor = {
        id: `factor-${counter}`,
        friendly_name: friendlyName,
        factor_type: "totp",
        status: "unverified",
        created_at: new Date().toISOString(),
        secret: "JBSWY3DPEHPK3PXP",
      };
      factors.push(factor);
      return {
        data: {
          id: factor.id,
          type: "totp" as const,
          totp: {
            // Supabase already returns the QR as a data URI (hand-testing, 2026-09-30).
            qr_code: "data:image/svg+xml;utf-8,<svg xmlns='http://www.w3.org/2000/svg'></svg>",
            secret: factor.secret,
            uri: `otpauth://totp/test?secret=${factor.secret}`,
          },
        },
        error: null,
      };
    },
    async challenge({ factorId }: { factorId: string }) {
      await yieldOnce();
      if (!factors.some((factor) => factor.id === factorId)) {
        return {
          data: null,
          error: authError(404, "mfa_factor_not_found", "MFA factor not found"),
        };
      }
      counter += 1;
      const id = `challenge-${counter}`;
      challenges.set(id, factorId);
      return { data: { id }, error: null };
    },
    async verify({
      factorId,
      challengeId,
      code,
    }: {
      factorId: string;
      challengeId: string;
      code: string;
    }) {
      await yieldOnce();
      const factor = factors.find((candidate) => candidate.id === factorId);
      if (!factor || challenges.get(challengeId) !== factorId) {
        return {
          data: null,
          error: authError(404, "mfa_factor_not_found", "MFA factor not found"),
        };
      }
      if (code !== validCode) {
        return {
          data: null,
          error: authError(400, "mfa_verification_failed", "Invalid TOTP code entered"),
        };
      }
      factor.status = "verified";
      return { data: { access_token: "token" }, error: null };
    },
  };

  return {
    auth: { mfa },
    /** Test controls. */
    factors,
    setValidCode(code: string) {
      validCode = code;
    },
    seed(factor: Partial<FakeFactor> & Pick<FakeFactor, "id">) {
      factors.push({
        factor_type: "totp",
        status: "unverified",
        created_at: new Date().toISOString(),
        secret: "JBSWY3DPEHPK3PXP",
        ...factor,
      });
    },
  };
}
