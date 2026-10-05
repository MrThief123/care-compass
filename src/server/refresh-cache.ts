import { revalidatePath } from "next/cache";

/**
 * Drops the server and client router caches after data changes or the session ends, so the next
 * page visited reads fresh data (next.config.ts `staleTimes` keeps pages for 30 s otherwise).
 * Outside a Next.js request (unit tests) there is nothing to drop, so a throw is ignored.
 */
export function refreshCachedPages(): void {
  try {
    revalidatePath("/", "layout");
  } catch {
    // No request in scope.
  }
}
