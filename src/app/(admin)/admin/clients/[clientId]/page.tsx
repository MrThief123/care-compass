import { redirect } from "next/navigation";

import { adminClientBase } from "@/features/admin-client-view/client-routes";

/** Opens on Home, like the Family and carer client roots. */
export default async function AdminClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  redirect(`${adminClientBase((await params).clientId)}/home`);
}
