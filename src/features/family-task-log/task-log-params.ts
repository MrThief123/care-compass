import { z } from "zod";

import type { OccurrenceStatus } from "@/types/domain";

/**
 * The Task log's view state lives in the URL: `?q=<text>&status=<planned|done|overdue>&page=<n>`
 * (CHG-005, shared with Home). Everything read from a URL is untrusted, so it
 * is cleaned here, once, before it reaches the `getTaskLog` contract (which
 * rejects invalid input with a ZodError) or is written back into a link.
 */

/** A search longer than this is cut, so a hostile URL cannot make a huge database query. */
export const MAX_QUERY_LENGTH = 200;

/** A page number above this is clamped (a 400-digit `page` would parse to Infinity). */
export const MAX_PAGE = 1_000_000;

export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface TaskLogParams {
  /** Trimmed, at most `MAX_QUERY_LENGTH` characters; "" means no search. */
  q: string;
  /** Absent means all statuses. */
  status?: OccurrenceStatus;
  /** 1-based; 1 when absent or invalid. */
  page: number;
}

// Mirrors `OccurrenceStatusSchema` in `@/types/domain` (importing that value would pull every domain
// schema into the client bundle); the type check below fails if the two ever drift apart.
const StatusParamSchema = z.enum(["planned", "done", "overdue"]);
const statusMatchesDomain: [OccurrenceStatus] extends [z.infer<typeof StatusParamSchema>]
  ? [z.infer<typeof StatusParamSchema>] extends [OccurrenceStatus]
    ? true
    : never
  : never = true;
void statusMatchesDomain;

const PageParamSchema = z.string().regex(/^[0-9]+$/);

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/g;
// A well-formed surrogate pair, or else any single (lone) surrogate: pairs are kept, lone halves dropped.
const SURROGATES = /[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;

/** Limits the box to `MAX_QUERY_LENGTH` characters (code points, so an emoji is never split); does not trim. */
export function clampQueryLength(value: string): string {
  if (value.length <= MAX_QUERY_LENGTH) return value; // at most 200 UTF-16 units is at most 200 characters
  return Array.from(value.slice(0, MAX_QUERY_LENGTH * 2))
    .slice(0, MAX_QUERY_LENGTH)
    .join("");
}

/**
 * The text that is searched for and shown in the URL: lone surrogates dropped (they break
 * `encodeURIComponent`), NFC, control characters (NUL breaks a database search) turned into
 * spaces, trimmed, capped, trimmed again. Idempotent.
 */
export function normaliseQuery(raw: string): string {
  const cleaned = raw
    .slice(0, MAX_QUERY_LENGTH * 4)
    .replace(SURROGATES, (match) => (match.length === 2 ? match : ""))
    .normalize("NFC")
    .replace(CONTROL_CHARACTERS, " ")
    .trim();
  return clampQueryLength(cleaned).trim();
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Cleans raw `searchParams` into the validated view state. Never throws. */
export function parseTaskLogParams(raw: RawSearchParams | undefined): TaskLogParams {
  const source = raw ?? {};
  const status = StatusParamSchema.safeParse(firstValue(source.status));

  const pageText = PageParamSchema.safeParse(firstValue(source.page)?.trim());
  const page = pageText.success ? Math.min(Math.max(Number(pageText.data), 1), MAX_PAGE) : 1;

  return {
    q: normaliseQuery(firstValue(source.q) ?? ""),
    status: status.success ? status.data : undefined,
    page,
  };
}
