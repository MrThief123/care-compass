import { redirect } from "next/navigation";

import { getLandingPath } from "@/server/auth/queries";

// Depends on the session cookie, so never prerendered.
export const dynamic = "force-dynamic";

export default async function RootPage() {
  redirect(await getLandingPath());
}
