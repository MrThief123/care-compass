#!/usr/bin/env node
// F0-16: uploads the placeholder PDFs for the seeded documents to the LOCAL Storage bucket.
//
// `supabase db reset` loads supabase/seed.sql (rows, users, budgets) but SQL cannot put file
// bytes into Storage, so the five document tiles would have no file behind them. Run
//
//   npm run db:seed
//
// after `supabase db reset`. It is safe to run again (each upload replaces the same path).
//
// Guarded: it refuses to run when NODE_ENV=production or when NEXT_PUBLIC_SUPABASE_URL is not a
// local address, and it checks both before it reads a key or makes a request. Seed passwords
// are local-only (docs/SEED_DATA.md).
import { createClient } from "@supabase/supabase-js";

const LOCAL_URL = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/;

// One tiny valid PDF for every placeholder. supabase/seed.sql records this length as size_bytes.
const PLACEHOLDER_PDF = Buffer.from(
  [
    "%PDF-1.4",
    "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj",
    "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj",
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 100]>>endobj",
    "trailer<</Root 1 0 R>>",
    "%%EOF",
    "",
  ].join("\n"),
);

function refuse(message) {
  console.error(`seed refused: ${message}`);
  process.exit(1);
}

if (process.env.NODE_ENV === "production") {
  refuse("NODE_ENV is production. The seed only runs against a local database.");
}

// `.env.local` fills in what the shell has not set (it never overrides).
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: rely on the environment.
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!LOCAL_URL.test(url)) {
  refuse(
    `NEXT_PUBLIC_SUPABASE_URL (${url || "not set"}) is not a local address (127.0.0.1 or localhost).`,
  );
}
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) {
  refuse("SUPABASE_SERVICE_ROLE_KEY is not set. Copy it from `supabase status` into .env.local.");
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: documents, error } = await supabase
  .from("documents")
  .select("storage_path, filename, mime_type")
  .is("detached_at", null);
if (error) {
  refuse(`could not read the seeded documents: ${error.message}. Has \`supabase db reset\` run?`);
}
if (documents.length === 0) {
  refuse("no seeded documents found. Run `supabase db reset` first.");
}

for (const doc of documents) {
  const { error: uploadError } = await supabase.storage
    .from("client-documents")
    .upload(doc.storage_path, PLACEHOLDER_PDF, { contentType: doc.mime_type, upsert: true });
  if (uploadError) {
    refuse(`could not upload ${doc.filename}: ${uploadError.message}`);
  }
  console.log(`uploaded ${doc.filename}`);
}
console.log(`Seed files ready: ${documents.length} placeholder documents.`);
