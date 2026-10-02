/**
 * Mock-mode removal store for ADM-05 (`removeClient` / `getAdminClients`). Holds the ids of the
 * clients removed in this session; the shared `ADMIN_CLIENTS` fixture (`src/mocks/**`, Lane S) is
 * never mutated. Kept on `globalThis`, like the staff store, because Next bundles Server Actions
 * and pages separately. Resets when the server process restarts.
 */
const shared = globalThis as { __adminMockRemovedClients?: Set<string> };
const removed = (shared.__adminMockRemovedClients ??= new Set<string>());

export function isMockClientRemoved(id: string): boolean {
  return removed.has(id);
}

export function removeMockClient(id: string): void {
  removed.add(id);
}
