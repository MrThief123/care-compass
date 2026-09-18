#!/usr/bin/env node
// F0-04 AC-04: the service-role key must never reach the client bundle.
// Run after `next build`; searches .next/static (client output only — server
// chunks in .next/server legitimately reference the variable name).
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const NEEDLE = "SUPABASE_SERVICE_ROLE_KEY";
const clientDir = path.join(process.cwd(), ".next", "static");

function listFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return listFiles(full);
    return full.endsWith(".js") || full.endsWith(".js.map") ? [full] : [];
  });
}

const files = listFiles(clientDir);
const matches = files.filter((file) => readFileSync(file, "utf8").includes(NEEDLE));

if (matches.length > 0) {
  console.error(`Found "${NEEDLE}" in client bundle output:\n${matches.join("\n")}`);
  process.exit(1);
}

console.log(`OK: "${NEEDLE}" not found in ${files.length} client bundle file(s).`);
