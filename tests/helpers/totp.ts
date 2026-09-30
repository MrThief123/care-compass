import { createHmac } from "node:crypto";

/** Test-only RFC 6238 TOTP (SHA-1, 30 s step, 6 digits), matching Supabase Auth's defaults. No dependency (F0-20). */

function base32Decode(base32: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = base32.replace(/=+$/, "").replace(/\s+/g, "").toUpperCase();
  let bits = "";
  for (const char of clean) {
    const value = alphabet.indexOf(char);
    if (value === -1) continue;
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function totpCode(secret: string, time = Date.now()): string {
  const key = base32Decode(secret);
  const counter = Math.floor(time / 1000 / 30);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = hmac.readUInt8(hmac.length - 1) & 0xf;
  const binCode =
    ((hmac.readUInt8(offset) & 0x7f) << 24) |
    ((hmac.readUInt8(offset + 1) & 0xff) << 16) |
    ((hmac.readUInt8(offset + 2) & 0xff) << 8) |
    (hmac.readUInt8(offset + 3) & 0xff);
  return (binCode % 1_000_000).toString().padStart(6, "0");
}

/**
 * A current code that differs from `previous`. Waits for the next 30 s window when needed, so a
 * second verification never replays the code the first one used (servers may refuse a reused code).
 */
export async function freshTotpCode(secret: string, previous?: string): Promise<string> {
  const deadline = Date.now() + 35_000;
  for (;;) {
    const code = totpCode(secret);
    if (code !== previous) return code;
    if (Date.now() > deadline) throw new Error("no fresh TOTP code within 35 s");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
