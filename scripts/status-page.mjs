#!/usr/bin/env node
// Refreshes the data block of care-compass-status.html from plan-status.mjs --json, the
// acceptance-criteria files and (if `gh` is available) GitHub pull requests.
//
//   node scripts/status-page.mjs          rewrite the `const D = {...}` line in place
//
// Only the data line is touched. The prose in the Housekeeping and Plan update sections is
// edited by hand in the same commit. Run it on an up-to-date `main` (or a branch merged with it).
import { execFileSync } from "node:child_process";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = path.join(ROOT, "care-compass-status.html");
const DEV = path.join(ROOT, "docs", "development");

const run = (cmd, args) =>
  execFileSync(cmd, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 });
const DONE = ["MERGED", "DONE", "RELEASED"];
const isDone = (s) => DONE.some((d) => (s ?? "").startsWith(d));

const html = fs.readFileSync(PAGE, "utf8");
const dataLine = /^(\s*)const D = (\{.*\});?\s*$/m;
const previous = JSON.parse(html.match(dataLine)[2]);
const before = new Map(previous.features.map((f) => [f.id, f]));

// plan-status exits right after writing; a pipe can truncate large output, so go through a file.
const tmp = path.join(os.tmpdir(), `plan-status-${process.pid}.json`);
execFileSync("sh", ["-c", `node scripts/plan-status.mjs --json > "${tmp}"`], { cwd: ROOT });
const plan = JSON.parse(fs.readFileSync(tmp, "utf8"));
fs.rmSync(tmp);

// Pull requests by head branch (merged ones first, so a feature's merged PR wins).
let prs = [];
try {
  prs = JSON.parse(
    run("gh", [
      "pr",
      "list",
      "--state",
      "all",
      "--limit",
      "400",
      "--json",
      "number,headRefName,baseRefName,state,mergedAt,url,mergedBy,author",
    ]),
  );
} catch {
  console.warn("gh unavailable: keeping the previous pr data");
}
const prFor = (branch) => {
  const hits = prs.filter((p) => p.headRefName === branch);
  const pick = hits.find((p) => p.state === "MERGED") ?? hits.find((p) => p.state === "OPEN");
  return pick
    ? {
        n: pick.number,
        base: pick.baseRefName,
        state: pick.state,
        url: pick.url,
        at: pick.mergedAt,
        by: pick.mergedBy?.login ?? pick.author?.login ?? null,
      }
    : null;
};

const acCounts = (stream, slug) => {
  const p = path.join(DEV, stream, slug, "ACCEPTANCE_CRITERIA.md");
  if (!fs.existsSync(p)) return { acTotal: 0, acMet: 0 };
  const rows = fs
    .readFileSync(p, "utf8")
    .split("\n")
    .filter((l) => /^\| AC-\d+ /.test(l));
  const met = rows.filter((l) => {
    const cells = l.split("|").map((c) => c.trim());
    return (cells[cells.length - 2] ?? "").startsWith("MET");
  });
  return { acTotal: rows.length, acMet: met.length };
};

const trackOf = (f) =>
  /-UI-\d/.test(f.id) ? "screen" : ["S", "B", "I"].includes(f.lane) ? "core" : "wired";
const stateOf = (f) => {
  if (f.sprint === "POST-SPRINT") return "post";
  if (/^RETIRED/.test(f.status)) return "retired";
  if (isDone(f.status)) return "done";
  if (f.ready) return "ready";
  if (/^(IN PROGRESS|READY FOR PR|IN REVIEW)/.test(f.status)) return "progress";
  return "blocked";
};

const features = plan.map((f) => {
  const old = before.get(f.id) ?? {};
  const pr = prFor(f.branch) ?? old.pr ?? null;
  const state = stateOf(f);
  const onMain =
    state === "done"
      ? pr
        ? (pr.state === "MERGED" && pr.base === "main") || old.onMain === true
        : old.onMain === true
      : false;
  return {
    ...f,
    docsStatus: f.status,
    inDevBranch: state === "done",
    onMain,
    docsStale: Boolean(pr && pr.state === "MERGED" && !isDone(f.status) && state !== "retired"),
    state,
    track: old.track ?? trackOf(f),
    readyViaOverlay: false,
    ...acCounts(f.stream, f.slug),
    ...(old.builder ? { builder: old.builder } : {}),
    pr,
  };
});

const main = run("git", ["rev-parse", "--short", "origin/main"]).trim();
const D = { meta: { generatedAt: new Date().toISOString(), main }, features };
fs.writeFileSync(
  PAGE,
  html.replace(dataLine, (_, ws) => `${ws}const D = ${JSON.stringify(D)};`),
);
console.log(`status page data refreshed: ${features.length} features, main ${main}`);
