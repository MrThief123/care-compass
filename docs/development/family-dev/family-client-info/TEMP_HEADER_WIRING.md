# Temporary `getClientHeaderSummary` wiring (FAM-09 verification only)

**Status:** not committed to source. The patch below was applied locally to run the FAM-09 browser check and e2e, then reverted. It is kept here so the real feature can start from it.

## The gap
`getClientHeaderSummary` (`src/server/clients/queries.ts`) still ends in `notImplementedForSupabase("clients", "getClientHeaderSummary")` on `main`. The family layout and Family Settings call it, so under `DATA_SOURCE=supabase` every `/family/[clientId]/*` page errors. No feature in `DEVELOPMENT_PLAN.md` owns it: F0-15 built it mock-only; F0-07 and shared-root-route (FD-05) call it "the Phase 3 wiring of `clients.getClientHeaderSummary`" without an ID. ADM-04 (`feature/admin-clients`) still has the stub.

## Draft feature card (for the human to place; a requirements change, CLAUDE.md §9)
- **Name:** Shared — Client header summary from Supabase (suggested ID: F0-20)
- **Lane:** B (shared) · **PR target:** `main` · **Branch:** `feature/shared-client-header-summary`
- **Description:** implement the supabase branch of `getClientHeaderSummary`: first and last name, age from date of birth (as of now, Australia/Melbourne), suburb, and current organisation name (omitted when none), through RLS. Unknown or unauthorised client: throws with no client data in the message.
- **Dependencies:** F0-06, F0-15. **Unblocks:** live browser/e2e checks for every Family screen (FAM-09, FAM-15 and later), carer/admin shells that reuse it.
- **Open points:** can a family member read the `organisations` row for their client's organisation under current RLS (the patch below assumes yes; unverified)? Age should reuse the mock's `ageFromDob` logic with Melbourne time, not the naive local-time code below. Needs tests-first (integration + pgTAP for family, carer, admin and unlinked user).

## Temporary patch (naive; do not ship)
```diff
diff --git a/src/server/clients/queries.ts b/src/server/clients/queries.ts
index 8c40df4..06e6823 100644
--- a/src/server/clients/queries.ts
+++ b/src/server/clients/queries.ts
@@ -23,7 +23,32 @@ export async function getClientHeaderSummary(clientId: string): Promise<mock.Cli
   if (mode === "mock") {
     return mock.getClientHeaderSummary(clientId);
   }
-  notImplementedForSupabase("clients", "getClientHeaderSummary");
+
+  // TEMPORARY (FAM-09 FD-07): local verification only, never committed.
+  const { createClient } = await import("@/lib/supabase/server");
+  const supabase = await createClient();
+  const { data, error } = await supabase
+    .from("clients")
+    .select("id, first_name, last_name, date_of_birth, suburb, organisations(name)")
+    .eq("id", clientId)
+    .single();
+  if (error || !data) throw new Error("getClientHeaderSummary: could not load the client.");
+  const dob = data.date_of_birth ? new Date(data.date_of_birth) : undefined;
+  const now = new Date();
+  const age = dob
+    ? now.getFullYear() -
+      dob.getFullYear() -
+      (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0)
+    : 0;
+  const organisation = data.organisations as unknown as { name: string } | null;
+  return {
+    id: data.id,
+    firstName: data.first_name,
+    lastName: data.last_name,
+    age,
+    suburb: data.suburb ?? undefined,
+    organisationName: organisation?.name,
+  };
 }
 
 /**
```
