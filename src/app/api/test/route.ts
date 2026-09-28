import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * F0-04 dev connectivity check, read by `src/app/dev-preview-database/page.tsx`. Originally
 * queried a `test` table that no migration ever created — untyped, so it compiled, but was
 * broken at runtime against a real database (found by F0-07, ADR-01/F0-18 DECISIONS.md).
 * `organisations` is a harmless, always-present table: this only needs to prove the round
 * trip to the database works, not return anything meaningful.
 */
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("organisations").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
