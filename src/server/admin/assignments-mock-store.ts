/**
 * Mock-mode store for ADM-08 (`getCarerAssignments`/`removeCarerAssignment`). A module-scoped
 * list of carer-client pairs, in the shape the real query returns; removing a pair drops it, as
 * ending its shifts does in the database. Resets when the server process restarts, like the other
 * mock-mode stores in this folder (staff-mock-store.ts).
 */
import { CLIENTS } from "@/mocks/fixtures";
import type { CarerAssignment } from "@/server/admin/assignments-queries";

const clientId = (key: string) => CLIENTS.find((client) => client.id === key)?.id ?? key;
const clientName = (key: string) => {
  const client = CLIENTS.find((row) => row.id === key);
  return client ? `${client.firstName} ${client.lastName}` : key;
};

function pair(
  carerId: string,
  client: string,
  shiftCount: number,
  nextShift: CarerAssignment["nextShift"],
): CarerAssignment {
  return {
    carerId,
    clientId: clientId(client),
    clientName: clientName(client),
    shiftCount,
    nextShift,
  };
}

// On `globalThis` for the same reason as staff-mock-store.ts: actions and pages are bundled apart.
const shared = globalThis as { __adminMockAssignments?: { rows: CarerAssignment[] } };
const store = (shared.__adminMockAssignments ??= { rows: seed() });

function seed(): CarerAssignment[] {
  return [
    pair("staff-aisha", "client-margaret", 3, { date: "2026-10-05", start: "07:00", end: "11:00" }),
    pair("staff-aisha", "client-elsie", 2, { date: "2026-10-06", start: "13:00", end: "17:00" }),
    pair("staff-daniel", "client-robert", 1, { date: "2026-10-05", start: "09:00", end: "12:00" }),
  ];
}

export function listMockAssignments(): CarerAssignment[] {
  return store.rows.map((row) => ({ ...row, nextShift: { ...row.nextShift } }));
}

/** Drops the pair and returns how many shifts it had (0 when it is already gone). */
export function removeMockAssignment(carerId: string, client: string): number {
  const found = store.rows.find((row) => row.carerId === carerId && row.clientId === client);
  if (!found) return 0;
  store.rows = store.rows.filter((row) => row !== found);
  return found.shiftCount;
}
